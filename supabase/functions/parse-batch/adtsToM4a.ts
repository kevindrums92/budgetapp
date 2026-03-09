/**
 * Minimal ADTS AAC → M4A (ISO BMFF) muxer.
 *
 * The capacitor-voice-recorder plugin on Android outputs raw AAC in ADTS format
 * (just a stream of frames with sync headers). OpenAI's transcription API requires
 * a proper container (M4A/MP4/WebM/etc). This module wraps ADTS frames in a
 * minimal M4A container that OpenAI can process.
 */

// AAC sampling frequency table (ISO 14496-3)
const SAMPLING_FREQUENCIES = [
  96000, 88200, 64000, 48000, 44100, 32000,
  24000, 22050, 16000, 12000, 11025, 8000, 7350,
];

interface AdtsInfo {
  profile: number;
  samplingFreqIndex: number;
  sampleRate: number;
  channelConfig: number;
  frameSizes: number[];
  rawFrames: Uint8Array;
}

/** Check if data starts with ADTS sync word */
export function isAdtsData(data: Uint8Array): boolean {
  return data.length >= 7 && data[0] === 0xFF && (data[1] & 0xF0) === 0xF0;
}

/** Parse ADTS stream → extract metadata + raw AAC frames (without ADTS headers) */
function parseAdts(data: Uint8Array): AdtsInfo {
  const frameSizes: number[] = [];
  const chunks: Uint8Array[] = [];
  let offset = 0;
  let profile = 1;
  let samplingFreqIndex = 4;
  let channelConfig = 1;

  while (offset < data.length - 6) {
    if (data[offset] !== 0xFF || (data[offset + 1] & 0xF0) !== 0xF0) {
      offset++;
      continue;
    }

    const protectionAbsent = data[offset + 1] & 0x01;
    profile = (data[offset + 2] >> 6) & 0x03;
    samplingFreqIndex = (data[offset + 2] >> 2) & 0x0F;
    channelConfig = ((data[offset + 2] & 0x01) << 2) | ((data[offset + 3] >> 6) & 0x03);

    const frameLength =
      ((data[offset + 3] & 0x03) << 11) |
      (data[offset + 4] << 3) |
      ((data[offset + 5] >> 5) & 0x07);

    if (frameLength < 7 || offset + frameLength > data.length) break;

    const headerSize = protectionAbsent ? 7 : 9;
    const raw = data.slice(offset + headerSize, offset + frameLength);
    chunks.push(raw);
    frameSizes.push(raw.length);
    offset += frameLength;
  }

  let total = 0;
  for (const c of chunks) total += c.length;
  const rawFrames = new Uint8Array(total);
  let pos = 0;
  for (const c of chunks) {
    rawFrames.set(c, pos);
    pos += c.length;
  }

  return {
    profile,
    samplingFreqIndex,
    sampleRate: SAMPLING_FREQUENCIES[samplingFreqIndex] || 44100,
    channelConfig: channelConfig || 1,
    frameSizes,
    rawFrames,
  };
}

// ─── Byte-level helpers ──────────────────────────────────────────────

function concat(...arrays: Uint8Array[]): Uint8Array {
  let n = 0;
  for (const a of arrays) n += a.length;
  const out = new Uint8Array(n);
  let off = 0;
  for (const a of arrays) { out.set(a, off); off += a.length; }
  return out;
}

function raw(bytes: number[]): Uint8Array {
  return new Uint8Array(bytes);
}

function u16(v: number): number[] {
  return [(v >> 8) & 0xFF, v & 0xFF];
}

function u32(v: number): number[] {
  return [(v >>> 24) & 0xFF, (v >> 16) & 0xFF, (v >> 8) & 0xFF, v & 0xFF];
}

function ascii(s: string): number[] {
  return Array.from(s, (c) => c.charCodeAt(0));
}

// ─── MP4 box builders ────────────────────────────────────────────────

function box(type: string, payload: Uint8Array): Uint8Array {
  const size = 8 + payload.length;
  const out = new Uint8Array(size);
  out[0] = (size >>> 24) & 0xFF;
  out[1] = (size >> 16) & 0xFF;
  out[2] = (size >> 8) & 0xFF;
  out[3] = size & 0xFF;
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(payload, 8);
  return out;
}

function fullBox(type: string, version: number, flags: number, payload: Uint8Array): Uint8Array {
  return box(type, concat(raw([version, (flags >> 16) & 0xFF, (flags >> 8) & 0xFF, flags & 0xFF]), payload));
}

// ─── AudioSpecificConfig (2 bytes for AAC-LC) ───────────────────────

function buildAsc(profile: number, freqIdx: number, channels: number): Uint8Array {
  const aot = profile + 1; // ADTS profile is 0-based, ASC audioObjectType is 1-based
  const b0 = ((aot & 0x1F) << 3) | ((freqIdx & 0x0E) >> 1);
  const b1 = ((freqIdx & 0x01) << 7) | ((channels & 0x0F) << 3);
  return raw([b0, b1]);
}

// ─── ESDS (Elementary Stream Descriptor) ─────────────────────────────

function buildEsds(asc: Uint8Array, avgBitrate: number, maxBitrate: number): Uint8Array {
  // DecoderSpecificInfo (tag 0x05)
  const dsi = raw([0x05, asc.length, ...asc]);

  // DecoderConfigDescriptor (tag 0x04)
  const dcdContent = raw([
    0x40,             // objectTypeIndication: Audio ISO/IEC 14496-3
    0x15,             // streamType=5(audio)<<2 | upStream=0<<1 | reserved=1
    0x00, 0x00, 0x00, // bufferSizeDB
    ...u32(maxBitrate),
    ...u32(avgBitrate),
    ...dsi,
  ]);
  const dcd = raw([0x04, dcdContent.length, ...dcdContent]);

  // SL_ConfigDescriptor (tag 0x06)
  const slcd = raw([0x06, 0x01, 0x02]);

  // ES_Descriptor (tag 0x03)
  const esContent = raw([
    ...u16(1),  // ES_ID
    0x00,       // flags
    ...dcd,
    ...slcd,
  ]);
  const esDesc = raw([0x03, esContent.length, ...esContent]);

  return fullBox("esds", 0, 0, raw([...esDesc]));
}

// ─── Build moov box ──────────────────────────────────────────────────

function buildMoov(info: AdtsInfo, mdatDataOffset: number): Uint8Array {
  const { sampleRate, channelConfig, frameSizes, rawFrames, profile, samplingFreqIndex } = info;
  const numFrames = frameSizes.length;
  const totalSamples = numFrames * 1024;
  const avgBitrate = Math.round((rawFrames.length * 8 * sampleRate) / totalSamples);
  const maxBitrate = avgBitrate * 2;

  const asc = buildAsc(profile, samplingFreqIndex, channelConfig);

  // ── mvhd (Movie Header) ──
  const mvhd = fullBox("mvhd", 0, 0, raw([
    ...u32(0),               // creation_time
    ...u32(0),               // modification_time
    ...u32(sampleRate),      // timescale
    ...u32(totalSamples),    // duration
    0x00, 0x01, 0x00, 0x00,  // rate = 1.0 (fixed 16.16)
    0x01, 0x00,               // volume = 1.0 (fixed 8.8)
    ...new Array(10).fill(0), // reserved
    // Identity matrix (36 bytes)
    ...u32(0x00010000), ...u32(0), ...u32(0),
    ...u32(0), ...u32(0x00010000), ...u32(0),
    ...u32(0), ...u32(0), ...u32(0x40000000),
    ...new Array(24).fill(0), // pre_defined
    ...u32(2),               // next_track_ID
  ]));

  // ── tkhd (Track Header) ──
  const tkhd = fullBox("tkhd", 0, 0x03, raw([ // flags: track_enabled | track_in_movie
    ...u32(0),               // creation_time
    ...u32(0),               // modification_time
    ...u32(1),               // track_ID
    ...u32(0),               // reserved
    ...u32(totalSamples),    // duration
    ...new Array(8).fill(0), // reserved
    ...u16(0),               // layer
    ...u16(0),               // alternate_group
    0x01, 0x00,               // volume = 1.0 (fixed 8.8)
    ...u16(0),               // reserved
    // Identity matrix (36 bytes)
    ...u32(0x00010000), ...u32(0), ...u32(0),
    ...u32(0), ...u32(0x00010000), ...u32(0),
    ...u32(0), ...u32(0), ...u32(0x40000000),
    ...u32(0),               // width
    ...u32(0),               // height
  ]));

  // ── mdhd (Media Header) ──
  const mdhd = fullBox("mdhd", 0, 0, raw([
    ...u32(0),            // creation_time
    ...u32(0),            // modification_time
    ...u32(sampleRate),   // timescale
    ...u32(totalSamples), // duration
    0x55, 0xC4,            // language: 'und' (undetermined) packed as ISO 639-2/T
    ...u16(0),            // pre_defined
  ]));

  // ── hdlr (Handler) ──
  const hdlr = fullBox("hdlr", 0, 0, raw([
    ...u32(0),               // pre_defined
    ...ascii("soun"),        // handler_type
    ...new Array(12).fill(0), // reserved
    ...ascii("SoundHandler"), 0x00, // name (null-terminated)
  ]));

  // ── smhd (Sound Media Header) ──
  const smhd = fullBox("smhd", 0, 0, raw([
    ...u16(0), // balance
    ...u16(0), // reserved
  ]));

  // ── dinf > dref > url ──
  const url = fullBox("url ", 0, 0x01, raw([])); // flag 0x01 = self-contained
  const dref = fullBox("dref", 0, 0, concat(raw([...u32(1)]), url));
  const dinf = box("dinf", dref);

  // ── esds inside mp4a ──
  const esds = buildEsds(asc, avgBitrate, maxBitrate);

  // ── mp4a (Audio Sample Entry) ──
  const mp4a = box("mp4a", concat(
    raw([
      0, 0, 0, 0, 0, 0,          // reserved
      ...u16(1),                  // data_reference_index
      0, 0, 0, 0, 0, 0, 0, 0,    // reserved
      ...u16(channelConfig),      // channel_count
      ...u16(16),                 // sample_size (bits)
      ...u16(0),                  // pre_defined
      ...u16(0),                  // reserved
      ...u16(sampleRate), 0, 0,   // sample_rate (fixed 16.16, high word = rate, low = 0)
    ]),
    esds,
  ));

  // ── stsd (Sample Description) ──
  const stsd = fullBox("stsd", 0, 0, concat(raw([...u32(1)]), mp4a));

  // ── stts (Time-to-Sample) ──
  const stts = fullBox("stts", 0, 0, raw([
    ...u32(1),          // entry_count
    ...u32(numFrames),  // sample_count
    ...u32(1024),       // sample_delta (AAC-LC = 1024 samples/frame)
  ]));

  // ── stsc (Sample-to-Chunk) ──
  const stsc = fullBox("stsc", 0, 0, raw([
    ...u32(1),          // entry_count
    ...u32(1),          // first_chunk
    ...u32(numFrames),  // samples_per_chunk (all frames in one chunk)
    ...u32(1),          // sample_description_index
  ]));

  // ── stsz (Sample Sizes) ──
  const sizes: number[] = [];
  for (const s of frameSizes) sizes.push(...u32(s));
  const stsz = fullBox("stsz", 0, 0, raw([
    ...u32(0),          // sample_size (0 = variable)
    ...u32(numFrames),  // sample_count
    ...sizes,
  ]));

  // ── stco (Chunk Offsets) ──
  const stco = fullBox("stco", 0, 0, raw([
    ...u32(1),               // entry_count
    ...u32(mdatDataOffset),  // chunk_offset (points to first byte of audio in mdat)
  ]));

  // ── Assemble ──
  const stbl = box("stbl", concat(stsd, stts, stsc, stsz, stco));
  const minf = box("minf", concat(smhd, dinf, stbl));
  const mdia = box("mdia", concat(mdhd, hdlr, minf));
  const trak = box("trak", concat(tkhd, mdia));
  const moov = box("moov", concat(mvhd, trak));

  return moov;
}

// ─── Public API ──────────────────────────────────────────────────────

/**
 * Wrap raw ADTS AAC data in a minimal M4A container.
 * Returns the complete M4A file as Uint8Array.
 */
export function wrapAdtsInM4a(adtsData: Uint8Array): Uint8Array {
  const info = parseAdts(adtsData);

  if (info.frameSizes.length === 0) {
    throw new Error("No valid ADTS frames found in audio data");
  }

  console.log(
    `[adtsToM4a] Parsed ${info.frameSizes.length} AAC frames, ` +
    `sampleRate=${info.sampleRate}, channels=${info.channelConfig}, ` +
    `rawSize=${info.rawFrames.length}`
  );

  // Layout: ftyp | moov | mdat
  // Build ftyp (fixed size)
  const ftyp = box("ftyp", raw([
    ...ascii("M4A "),   // major_brand
    ...u32(0),          // minor_version
    ...ascii("M4A "),   // compatible_brands
    ...ascii("mp42"),
    ...ascii("isom"),
  ]));

  // Build moov with placeholder offset to determine its size
  const moovPlaceholder = buildMoov(info, 0);
  const mdatDataOffset = ftyp.length + moovPlaceholder.length + 8; // +8 for mdat header

  // Rebuild moov with correct mdat offset
  const moov = buildMoov(info, mdatDataOffset);

  // Build mdat
  const mdat = box("mdat", info.rawFrames);

  const result = concat(ftyp, moov, mdat);
  console.log(`[adtsToM4a] Created M4A file: ${result.length} bytes`);
  return result;
}

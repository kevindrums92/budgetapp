import React from "react";
import { NavLink } from "react-router-dom";

type Props = { onAdd: () => void };

function Tab({
    to,
    label,
    icon,
}: {
    to: string;
    label: string;
    icon: (active: boolean) => React.ReactNode;
}) {
    return (
        <NavLink
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
                `flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] ${isActive ? "text-[#18B7B0]" : "text-gray-500"
                }`
            }
        >
            {({ isActive }) => (
                <>
                    {icon(isActive)}
                    <span className="leading-none tracking-tight">{label}</span>
                </>
            )}
        </NavLink>
    );
}

export default function BottomBar({ onAdd }: Props) {
    return (
        <div className="fixed left-0 right-0 bottom-0 z-50">
            {/* iOS-ish: blur + borde sutil + sombra hacia arriba */}
            <div
                className={[
                    "relative",
                    "border-t border-gray-200/70",
                    "bg-white/75 backdrop-blur-xl",
                    "shadow-[0_-10px_30px_rgba(0,0,0,0.10)]",
                    "pt-3 pb-[calc(env(safe-area-inset-bottom)+10px)]",
                ].join(" ")}
            >
                {/* “notch”/cutout visual leve para el FAB */}
                <div className="relative">
                    <div className="grid grid-cols-5">
                        <Tab
                            to="/"
                            label="Home"
                            icon={(active) => (
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                    <path
                                        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
                                        stroke="currentColor"
                                        strokeWidth={active ? 2.0 : 1.8}
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            )}
                        />

                        <Tab
                            to="/budget"
                            label="Budget"
                            icon={(active) => (
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                    <path
                                        d="M5 7h14M5 12h10M5 17h14"
                                        stroke="currentColor"
                                        strokeWidth={active ? 2.0 : 1.8}
                                        strokeLinecap="round"
                                    />
                                </svg>
                            )}
                        />

                        {/* Slot central */}
                        <div className="flex items-center justify-center py-2">
                            <span className="h-7 w-7" />
                        </div>

                        <Tab
                            to="/stats"
                            label="Stats"
                            icon={(active) => (
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                    <path
                                        d="M6 20V11M12 20V4M18 20v-7"
                                        stroke="currentColor"
                                        strokeWidth={active ? 2.0 : 1.8}
                                        strokeLinecap="round"
                                    />
                                </svg>
                            )}
                        />

                        <Tab
                            to="/settings"
                            label="Settings"
                            icon={(active) => (
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                    <path
                                        d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
                                        stroke="currentColor"
                                        strokeWidth={active ? 2.0 : 1.8}
                                    />
                                    <path
                                        d="M19.4 15a7.9 7.9 0 0 0 .1-2l2-1.5-2-3.5-2.4.6a8 8 0 0 0-1.7-1l-.4-2.4H10l-.4 2.4a8 8 0 0 0-1.7 1L5.5 8 3.5 11.5l2 1.5a7.9 7.9 0 0 0 .1 2l-2 1.5 2 3.5 2.4-.6a8 8 0 0 0 1.7 1l.4 2.4h4l.4-2.4a8 8 0 0 0 1.7-1l2.4.6 2-3.5-2-1.5Z"
                                        stroke="currentColor"
                                        strokeWidth="1.1"
                                        opacity="0.55"
                                    />
                                </svg>
                            )}
                        />
                    </div>

                    {/* FAB: un poco más iOS (sombra suave, ring) */}
                    <button
                        type="button"
                        onClick={onAdd}
                        className={[
                            "absolute left-1/2 top-0 -translate-x-1/2 -translate-y-[55%]",
                            "grid h-14 w-14 place-items-center rounded-full",
                            "bg-black text-white",
                            "shadow-[0_12px_28px_rgba(0,0,0,0.22)]",
                            "ring-4 ring-white/70",
                            "active:scale-[0.98]",
                        ].join(" ")}
                        aria-label="Agregar movimiento"
                        title="Agregar"
                    >
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M12 5v14M5 12h14"
                                stroke="currentColor"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                            />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}

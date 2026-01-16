#!/bin/bash
# Release script for BudgetApp
# Usage: npm run release

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
log() {
    echo -e "${BLUE}[RELEASE]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Validar que estamos en develop
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "develop" ]; then
    error "Debes estar en la rama 'develop' para hacer un release"
fi

# Validar que no hay cambios sin commitear
if [ -n "$(git status --porcelain)" ]; then
    error "Hay cambios sin commitear. Commitea o descarta los cambios antes de continuar."
fi

# Actualizar develop
log "Actualizando rama develop..."
git pull origin develop || error "No se pudo actualizar develop"

# Mostrar versión actual
CURRENT_VERSION=$(node -p "require('./package.json').version")
log "Versión actual: $CURRENT_VERSION"

# Preguntar tipo de release
echo ""
echo "¿Qué tipo de release quieres hacer?"
echo "1) patch (bug fixes) - $CURRENT_VERSION -> $(npm version patch --no-git-tag-version -s && node -p "require('./package.json').version" && npm version patch --no-git-tag-version -s > /dev/null 2>&1)"
echo "2) minor (new features) - $CURRENT_VERSION -> $(npm version minor --no-git-tag-version -s && node -p "require('./package.json').version" && npm version minor --no-git-tag-version -s > /dev/null 2>&1)"
echo "3) major (breaking changes) - $CURRENT_VERSION -> $(npm version major --no-git-tag-version -s && node -p "require('./package.json').version" && npm version major --no-git-tag-version -s > /dev/null 2>&1)"
read -p "Selecciona (1/2/3): " release_type

case $release_type in
    1) VERSION_TYPE="patch" ;;
    2) VERSION_TYPE="minor" ;;
    3) VERSION_TYPE="major" ;;
    *) error "Opción inválida" ;;
esac

echo ""
log "Iniciando release $VERSION_TYPE..."
echo ""

# 1. Incrementar versión en package.json
log "Incrementando versión..."
npm version $VERSION_TYPE --no-git-tag-version
NEW_VERSION=$(node -p "require('./package.json').version")
success "Nueva versión: v$NEW_VERSION"

# 2. Actualizar CHANGELOG
echo ""
log "Ahora debes actualizar el CHANGELOG.md con los cambios de esta versión"
warning "Agrega una sección para la versión v$NEW_VERSION en CHANGELOG.md"
echo ""
read -p "Presiona Enter cuando hayas actualizado el CHANGELOG..."

# Validar que CHANGELOG fue modificado
if ! git diff --name-only | grep -q "CHANGELOG.md"; then
    warning "No se detectaron cambios en CHANGELOG.md"
    read -p "¿Continuar de todas formas? (s/n): " continue_without_changelog
    if [ "$continue_without_changelog" != "s" ]; then
        error "Release cancelado"
    fi
fi

# 3. Commit de los cambios de versión
echo ""
log "Creando commit de release..."
git add package.json package-lock.json CHANGELOG.md
git commit -m "chore: bump version to v$NEW_VERSION

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
success "Commit creado"

# 4. Push de develop
log "Pusheando cambios a develop..."
git push origin develop || error "No se pudo pushear develop"
success "Develop actualizado"

# 5. Merge a main
echo ""
log "Mergeando develop -> main..."
git checkout main || error "No se pudo cambiar a main"
git pull origin main || error "No se pudo hacer pull de main"
git merge develop --no-ff -m "chore: release v$NEW_VERSION

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>" || error "Conflicto al mergear. Resuelve los conflictos y completa el release manualmente."
success "Merge completado"

# 6. Crear tag
echo ""
log "Creando tag v$NEW_VERSION..."
git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"
success "Tag creado"

# 7. Push de main y tags
log "Pusheando main y tags..."
git push origin main || error "No se pudo pushear main"
git push origin "v$NEW_VERSION" || error "No se pudo pushear el tag"
success "Main y tags pusheados"

# 8. Volver a develop
echo ""
log "Volviendo a develop..."
git checkout develop
git pull origin develop
success "De vuelta en develop"

# Resumen final
echo ""
echo "════════════════════════════════════════════════════════════"
success "¡Release v$NEW_VERSION completado exitosamente!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "  📦 Versión: v$NEW_VERSION"
echo "  🏷️  Tag: v$NEW_VERSION creado en main"
echo "  🚀 Main actualizado y pusheado"
echo "  💚 De vuelta en develop"
echo ""
echo "  Ver release: git show v$NEW_VERSION"
echo "  Ver tag en GitHub: https://github.com/[tu-usuario]/budgetapp/releases/tag/v$NEW_VERSION"
echo ""

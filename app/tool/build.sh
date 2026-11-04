#!/usr/bin/env bash
# Builds public/vendor (Firebase + QR bundle, KaTeX) and copies fonts from the Trạng Rùa app.
set -euo pipefail
cd "$(dirname "$0")/.."
npx esbuild src/vendor.js --bundle --format=esm --platform=browser --minify --log-level=warning --outfile=public/vendor/vendor.js
# The pages load these bundles: every module of the two screens (and Firebase) transpiled for older phones
# (iOS Safari 14.5+, Android Chrome 64+; esbuild cannot lower destructuring below Safari 14.1), with the fake
# class split into its own chunk.
rm -f public/build/*.js && mkdir -p public/build
npx esbuild public/js/host.js public/js/play.js --bundle --splitting --format=esm --platform=browser --minify \
  --target=safari14.1,chrome64,firefox67,edge79 --log-level=warning --outdir=public/build
mkdir -p public/vendor/katex public/fonts
cp node_modules/katex/dist/katex.min.css node_modules/katex/dist/katex.min.js node_modules/katex/dist/contrib/auto-render.min.js public/vendor/katex/
rm -rf public/vendor/katex/fonts && cp -r node_modules/katex/dist/fonts public/vendor/katex/fonts
APP="$HOME/turtor_app/assets"
# The fonts are kept in public/fonts/; refresh them only on a machine that has the Trạng Rùa app (not on CI).
if [ -d "$APP/fonts" ]; then
  for w in Regular SemiBold Bold ExtraBold Black; do cp "$APP/fonts/BeVietnamPro-$w.ttf" public/fonts/; done
  cp "$APP/fonts/OFL-BeVietnamPro.txt" public/fonts/
fi

echo "build ok: $(du -sh public | cut -f1) in public/"

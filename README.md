# Pixeler

[깃허브 페이지](https://hyuckkim.github.io/Pixeler)에서 볼 수 있습니다.

이미지를 팔레트화시키고 각 팔레트의 색을 바꿀 수 있게 해주는 정적 사이트입니다.  
웹어셈블리를 사용했고 수집하는 데이터가 없습니다.

이미지를 팔레트화시키는 데 [ImageQuant 라이브러리](https://docs.rs/crate/imagequant)를 사용했습니다.  

## Requires
- typescript
- [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/)
## How To Build
```
git clone https://github.com/hyuckkim/Pixeler --recurse-submodules
cd Pixeler/palette-png
wasm-pack build --target web --out-dir ../pkg
cd ..
tsc
```

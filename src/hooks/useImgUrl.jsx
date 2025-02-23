const useImgUrl = (imgPath) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const basePath = isProduction ? '/worldWear_2024_hex_react' : '/';
  return isProduction
    ? new URL(`${basePath}${imgPath}`, import.meta.url).href
    : imgPath;
};

export default useImgUrl;

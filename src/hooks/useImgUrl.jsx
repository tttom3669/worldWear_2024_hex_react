const useImgUrl = () => {
  return (imgPath) => {
    const isProduction = import.meta.env.PROD;
    const basePath = isProduction ? '/worldWear_2024_hex_react' : '/';
    return isProduction
      ? new URL(`${basePath}${imgPath}`, import.meta.url).href
      : imgPath;
  };
};

export default useImgUrl;

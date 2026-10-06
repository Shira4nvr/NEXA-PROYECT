function toPublicUrl(req, url) {
  if (!url || /^https?:\/\//i.test(url)) return url;
  const base = process.env.PUBLIC_API_URL || `${req.protocol}://${req.get("host")}`;
  return `${base.replace(/\/$/, "")}${url.startsWith("/") ? url : `/${url}`}`;
}

function serializeProduct(req, product) {
  const images = (product.images || []).map((image) => ({
    ...image,
    url: toPublicUrl(req, image.url),
    altText: image.altText || product.name,
  }));

  return {
    ...product,
    price: product.basePrice,
    image: images[0]?.url || null,
    imageAlt: images[0]?.altText || product.name,
    images,
  };
}

module.exports = { serializeProduct };
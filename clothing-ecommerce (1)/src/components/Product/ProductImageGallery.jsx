"use client"

import { useState } from "react"

const ProductImageGallery = ({ images, productName, product }) => {
  const [selectedImage, setSelectedImage] = useState(0)
  const [imageLoading, setImageLoading] = useState(true)

  // Parse images để hiển thị
  let displayImages = [];

  if (images) {
    // If images is an array (from context processing)
    if (Array.isArray(images)) {
      displayImages = images.filter(img => img && img.trim() !== '' && !img.includes('data:image/svg+xml') && !img.includes('placeholder'));
    }
    // If images is an object with anhChinh, anhPhu properties
    else if (typeof images === 'object' && images !== null) {
      let imageArray = [];

      // Add main image first
      if (images.anhChinh) {
        imageArray.push(images.anhChinh);
      }

      // Add additional images
      if (images.anhPhu && Array.isArray(images.anhPhu)) {
        imageArray = [...imageArray, ...images.anhPhu];
      }

      displayImages = imageArray.filter(img => img && img.trim() !== '' && !img.includes('data:image/svg+xml') && !img.includes('placeholder'));
    }
  }
  // Fallback: try to get images from product
  else if (product && product.images) {
    if (Array.isArray(product.images)) {
      displayImages = product.images.filter(img => img && img.trim() !== '' && !img.includes('data:image/svg+xml') && !img.includes('placeholder'));
    } else if (typeof product.images === 'object') {
      let imageArray = [];
      if (product.images.anhChinh) {
        imageArray.push(product.images.anhChinh);
      }
      if (product.images.anhPhu && Array.isArray(product.images.anhPhu)) {
        imageArray = [...imageArray, ...product.images.anhPhu];
      }
      displayImages = imageArray.filter(img => img && img.trim() !== '' && !img.includes('data:image/svg+xml') && !img.includes('placeholder'));
    }
  }

  // Chỉ hiển thị placeholder khi thực sự không có ảnh nào
  const hasRealImages = displayImages.length > 0;

  if (!hasRealImages) {
    // SVG placeholder đơn giản chỉ khi không có ảnh
    const placeholderSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23f8f9fa' stroke='%23e9ecef' stroke-width='2'/%3E%3Cpath d='M160 180h80v40h-80zm40-40c11 0 20 9 20 20s-9 20-20 20-20-9-20-20 9-20 20-20zm-60 120h120l-30-40-20 20-30-30z' fill='%23dee2e6'/%3E%3C/svg%3E";
    displayImages = [placeholderSvg];
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square overflow-hidden border rounded-lg bg-gray-50">
        <img
          src={displayImages[selectedImage]}
          alt={`${productName || 'Product'} - Image ${selectedImage + 1}`}
          className="w-full h-full object-cover"
          onLoad={() => {
            setImageLoading(false);
          }}
        />
        {imageLoading && hasRealImages && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        )}
      </div>

      {/* Thumbnails - chỉ hiển thị khi có nhiều hơn 1 ảnh thật */}
      {hasRealImages && displayImages.length > 1 && (
        <div className="flex space-x-4 overflow-x-auto pb-2">
          {displayImages.map((image, index) => (
            <button
              key={index}
              onClick={() => {
                setSelectedImage(index);
                setImageLoading(true);
              }}
              className={`relative w-20 h-20 flex-shrink-0 border rounded-md overflow-hidden transition-all ${selectedImage === index ? "ring-2 ring-primary-600" : "hover:ring-1 ring-gray-300"
                }`}
            >
              <img
                src={image}
                alt={`${productName || 'Product'} - Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default ProductImageGallery

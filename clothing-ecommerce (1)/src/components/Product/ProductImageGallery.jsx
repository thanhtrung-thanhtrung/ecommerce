"use client"

import { useState } from "react"

const ProductImageGallery = ({ images, productName }) => {
  const [selectedImage, setSelectedImage] = useState(0)

  // Ensure images is an array
  const imageArray = Array.isArray(images) ? images : [images]

  // Use placeholder if no images
  const displayImages = imageArray.length > 0 ? imageArray : ["/placeholder.svg?height=600&width=600"]

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square overflow-hidden border rounded-lg">
        <img
          src={displayImages[selectedImage] || "/placeholder.svg"}
          alt={`${productName} - Image ${selectedImage + 1}`}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Thumbnails */}
      {displayImages.length > 1 && (
        <div className="flex space-x-4 overflow-x-auto pb-2">
          {displayImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={`relative w-20 h-20 flex-shrink-0 border rounded-md overflow-hidden ${
                selectedImage === index ? "ring-2 ring-primary-600" : ""
              }`}
            >
              <img
                src={image || "/placeholder.svg"}
                alt={`${productName} - Thumbnail ${index + 1}`}
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

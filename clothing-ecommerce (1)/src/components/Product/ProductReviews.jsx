"use client"

import { useState, useEffect } from "react"
import { useShop } from "../../contexts/ShopContext"
import { Star, ThumbsUp, Flag } from "lucide-react"
import { formatRelativeTime } from "../../utils/helpers"

const ProductReviews = ({ productId }) => {
  const { isAuthenticated } = useShop()
  const [reviews, setReviews] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [userReview, setUserReview] = useState(null)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")

  useEffect(() => {
    // Simulate fetching reviews
    setTimeout(() => {
      const mockReviews = [
        {
          id: 1,
          userId: 101,
          userName: "Nguyễn Văn A",
          rating: 5,
          comment: "Sản phẩm rất tốt, đúng như mô tả. Chất lượng vải tốt, form đẹp.",
          date: "2023-10-15T08:30:00",
          likes: 3,
          isVerified: true,
        },
        {
          id: 2,
          userId: 102,
          userName: "Trần Thị B",
          rating: 4,
          comment: "Giày đẹp, đi vừa vặn, giao hàng nhanh. Chỉ tiếc là màu sắc hơi khác so với hình.",
          date: "2023-10-10T14:20:00",
          likes: 1,
          isVerified: true,
        },
        {
          id: 3,
          userId: 103,
          userName: "Lê Văn C",
          rating: 3,
          comment: "Sản phẩm tạm ổn, nhưng giao hàng hơi chậm.",
          date: "2023-09-28T19:45:00",
          likes: 0,
          isVerified: false,
        },
      ]
      setReviews(mockReviews)
      setIsLoading(false)
    }, 1000)
  }, [productId])

  const handleSubmitReview = (e) => {
    e.preventDefault()

    // Simulate adding a review
    const newReview = {
      id: Date.now(),
      userId: 999,
      userName: "Bạn",
      rating,
      comment,
      date: new Date().toISOString(),
      likes: 0,
      isVerified: true,
    }

    setReviews([newReview, ...reviews])
    setUserReview(newReview)
    setShowReviewForm(false)
    setRating(5)
    setComment("")
  }

  const handleLikeReview = (reviewId) => {
    setReviews(reviews.map((review) => (review.id === reviewId ? { ...review, likes: review.likes + 1 } : review)))
  }

  const averageRating =
    reviews.length > 0 ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1) : 0

  const ratingCounts = [5, 4, 3, 2, 1].map((star) => reviews.filter((review) => review.rating === star).length)

  return (
    <div>
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Rating Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col items-center justify-center">
              <div className="text-5xl font-bold text-gray-800 mb-2">{averageRating}</div>
              <div className="flex items-center mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${star <= Math.round(averageRating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                      }`}
                  />
                ))}
              </div>
              <div className="text-sm text-gray-600">{reviews.length} đánh giá</div>
            </div>

            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((star, index) => (
                <div key={star} className="flex items-center">
                  <div className="flex items-center w-12">
                    <span className="text-sm font-medium text-gray-700">{star}</span>
                    <Star className="h-4 w-4 text-yellow-400 ml-1" />
                  </div>
                  <div className="flex-1 h-2 mx-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full"
                      style={{
                        width: `${reviews.length > 0 ? (ratingCounts[index] / reviews.length) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                  <div className="w-8 text-right text-sm text-gray-600">{ratingCounts[index]}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Write Review Button */}
          {isAuthenticated && !userReview && (
            <div className="flex justify-center">
              <button onClick={() => setShowReviewForm(true)} className="btn-primary">
                Viết đánh giá
              </button>
            </div>
          )}

          {/* Review Form */}
          {showReviewForm && (
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Đánh giá sản phẩm</h3>
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Đánh giá</label>
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button" onClick={() => setRating(star)} className="p-1">
                        <Star
                          className={`h-6 w-6 ${star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
                    Nhận xét
                  </label>
                  <textarea
                    id="comment"
                    rows="4"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                    className="form-input"
                    required
                  ></textarea>
                </div>
                <div className="flex justify-end space-x-2">
                  <button type="button" onClick={() => setShowReviewForm(false)} className="btn-outline">
                    Hủy
                  </button>
                  <button type="submit" className="btn-primary">
                    Gửi đánh giá
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Reviews List */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800">
              {reviews.length > 0 ? "Đánh giá từ khách hàng" : "Chưa có đánh giá nào"}
            </h3>

            {reviews.map((review) => (
              <div key={review.id} className="border-b pb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center">
                      <span className="font-medium text-gray-800">{review.userName}</span>
                      {review.isVerified && (
                        <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded">
                          Đã mua hàng
                        </span>
                      )}
                    </div>
                    <div className="flex items-center mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${star <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                            }`}
                        />
                      ))}
                      <span className="ml-2 text-xs text-gray-500">{formatRelativeTime(review.date)}</span>
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-gray-700">{review.comment}</p>
                <div className="flex items-center mt-3 space-x-4">
                  <button
                    onClick={() => handleLikeReview(review.id)}
                    className="flex items-center text-xs text-gray-500 hover:text-gray-700"
                  >
                    <ThumbsUp className="h-3.5 w-3.5 mr-1" />
                    Hữu ích ({review.likes})
                  </button>
                  <button className="flex items-center text-xs text-gray-500 hover:text-gray-700">
                    <Flag className="h-3.5 w-3.5 mr-1" />
                    Báo cáo
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductReviews


import { useState } from "react"
import { Link } from "react-router-dom"
import { Formik, Form, Field, ErrorMessage } from "formik"
import * as Yup from "yup"
import authAPI from "../../services/authAPI"
import { toast } from "react-toastify"

const ForgotPasswordPage = () => {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const validationSchema = Yup.object({
    email: Yup.string().email("Email không hợp lệ").required("Vui lòng nhập email"),
  })

  const handleSubmit = async (values) => {
    setIsLoading(true)
    try {
      await authAPI.forgotPassword(values.email)
      setIsSubmitted(true)
      toast.success("Đã gửi email khôi phục mật khẩu!")
    } catch (error) {
      toast.error(error.response?.data?.message || "Có lỗi xảy ra")
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-2xl">✓</span>
              </div>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Email đã được gửi!</h2>
            <p className="text-gray-600 mb-6">
              Chúng tôi đã gửi hướng dẫn khôi phục mật khẩu đến email của bạn. Vui lòng kiểm tra hộp thư và làm theo
              hướng dẫn.
            </p>
            <Link to="/login" className="btn-primary">
              Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">👟</span>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Quên mật khẩu</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Nhập email của bạn để nhận hướng dẫn khôi phục mật khẩu
          </p>
        </div>

        <Formik initialValues={{ email: "" }} validationSchema={validationSchema} onSubmit={handleSubmit}>
          {({ isSubmitting }) => (
            <Form className="mt-8 space-y-6">
              <div>
                <label htmlFor="email" className="form-label">
                  Email
                </label>
                <Field
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="form-input"
                  placeholder="Nhập email của bạn"
                />
                <ErrorMessage name="email" component="div" className="form-error" />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting || isLoading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? <div className="spinner w-5 h-5"></div> : "Gửi email khôi phục"}
                </button>
              </div>

              <div className="text-center">
                <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                  ← Quay lại đăng nhập
                </Link>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  )
}

export default ForgotPasswordPage


import { useEffect } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { Formik, Form, Field, ErrorMessage } from "formik"
import * as Yup from "yup"
import { loginUser, clearError } from "../../store/slices/authSlice"

const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const { isLoading, error, isAuthenticated } = useSelector((state) => state.auth)

  const from = location.state?.from?.pathname || "/"

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, from])

  useEffect(() => {
    dispatch(clearError())
  }, [dispatch])

  const validationSchema = Yup.object({
    email: Yup.string().email("Email không hợp lệ").required("Vui lòng nhập email"),
    matKhau: Yup.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự").required("Vui lòng nhập mật khẩu"),
  })

  const handleSubmit = (values) => {
    dispatch(loginUser(values))
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
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Đăng nhập tài khoản</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Hoặc{" "}
            <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
              tạo tài khoản mới
            </Link>
          </p>
        </div>

        <Formik initialValues={{ email: "", matKhau: "" }} validationSchema={validationSchema} onSubmit={handleSubmit}>
          {({ isSubmitting }) => (
            <Form className="mt-8 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">{error}</div>
              )}

              <div className="space-y-4">
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
                  <label htmlFor="matKhau" className="form-label">
                    Mật khẩu
                  </label>
                  <Field
                    id="matKhau"
                    name="matKhau"
                    type="password"
                    autoComplete="current-password"
                    className="form-input"
                    placeholder="Nhập mật khẩu"
                  />
                  <ErrorMessage name="matKhau" component="div" className="form-error" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                    Ghi nhớ đăng nhập
                  </label>
                </div>

                <div className="text-sm">
                  <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500">
                    Quên mật khẩu?
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting || isLoading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? <div className="spinner w-5 h-5"></div> : "Đăng nhập"}
                </button>
              </div>

              <div className="text-center">
                <span className="text-sm text-gray-600">
                  Chưa có tài khoản?{" "}
                  <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
                    Đăng ký ngay
                  </Link>
                </span>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  )
}

export default LoginPage

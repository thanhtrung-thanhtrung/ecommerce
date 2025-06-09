
import { useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { Formik, Form, Field, ErrorMessage } from "formik"
import * as Yup from "yup"
import { registerUser, clearError } from "../../store/slices/authSlice"

const RegisterPage = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { isLoading, error, isAuthenticated } = useSelector((state) => state.auth)

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/")
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    dispatch(clearError())
  }, [dispatch])

  const validationSchema = Yup.object({
    hoTen: Yup.string().min(2, "Họ tên phải có ít nhất 2 ký tự").required("Vui lòng nhập họ tên"),
    email: Yup.string().email("Email không hợp lệ").required("Vui lòng nhập email"),
    soDienThoai: Yup.string()
      .matches(/^[0-9]{10,11}$/, "Số điện thoại không hợp lệ")
      .required("Vui lòng nhập số điện thoại"),
    diaChi: Yup.string().min(10, "Địa chỉ phải có ít nhất 10 ký tự").required("Vui lòng nhập địa chỉ"),
    matKhau: Yup.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự").required("Vui lòng nhập mật khẩu"),
    xacNhanMatKhau: Yup.string()
      .oneOf([Yup.ref("matKhau"), null], "Mật khẩu xác nhận không khớp")
      .required("Vui lòng xác nhận mật khẩu"),
    dongYDieuKhoan: Yup.boolean().oneOf([true], "Vui lòng đồng ý với điều khoản sử dụng"),
  })

  const handleSubmit = (values) => {
    const { xacNhanMatKhau, dongYDieuKhoan, ...userData } = values
    dispatch(registerUser(userData))
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
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Tạo tài khoản mới</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Hoặc{" "}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              đăng nhập tài khoản có sẵn
            </Link>
          </p>
        </div>

        <Formik
          initialValues={{
            hoTen: "",
            email: "",
            soDienThoai: "",
            diaChi: "",
            matKhau: "",
            xacNhanMatKhau: "",
            dongYDieuKhoan: false,
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className="mt-8 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">{error}</div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="hoTen" className="form-label">
                    Họ và tên
                  </label>
                  <Field id="hoTen" name="hoTen" type="text" className="form-input" placeholder="Nhập họ và tên" />
                  <ErrorMessage name="hoTen" component="div" className="form-error" />
                </div>

                <div>
                  <label htmlFor="email" className="form-label">
                    Email
                  </label>
                  <Field id="email" name="email" type="email" className="form-input" placeholder="Nhập email" />
                  <ErrorMessage name="email" component="div" className="form-error" />
                </div>

                <div>
                  <label htmlFor="soDienThoai" className="form-label">
                    Số điện thoại
                  </label>
                  <Field
                    id="soDienThoai"
                    name="soDienThoai"
                    type="tel"
                    className="form-input"
                    placeholder="Nhập số điện thoại"
                  />
                  <ErrorMessage name="soDienThoai" component="div" className="form-error" />
                </div>

                <div>
                  <label htmlFor="diaChi" className="form-label">
                    Địa chỉ
                  </label>
                  <Field id="diaChi" name="diaChi" type="text" className="form-input" placeholder="Nhập địa chỉ" />
                  <ErrorMessage name="diaChi" component="div" className="form-error" />
                </div>

                <div>
                  <label htmlFor="matKhau" className="form-label">
                    Mật khẩu
                  </label>
                  <Field
                    id="matKhau"
                    name="matKhau"
                    type="password"
                    className="form-input"
                    placeholder="Nhập mật khẩu"
                  />
                  <ErrorMessage name="matKhau" component="div" className="form-error" />
                </div>

                <div>
                  <label htmlFor="xacNhanMatKhau" className="form-label">
                    Xác nhận mật khẩu
                  </label>
                  <Field
                    id="xacNhanMatKhau"
                    name="xacNhanMatKhau"
                    type="password"
                    className="form-input"
                    placeholder="Nhập lại mật khẩu"
                  />
                  <ErrorMessage name="xacNhanMatKhau" component="div" className="form-error" />
                </div>
              </div>

              <div className="flex items-center">
                <Field
                  id="dongYDieuKhoan"
                  name="dongYDieuKhoan"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="dongYDieuKhoan" className="ml-2 block text-sm text-gray-900">
                  Tôi đồng ý với{" "}
                  <Link to="/terms" className="text-primary-600 hover:text-primary-500">
                    điều khoản sử dụng
                  </Link>{" "}
                  và{" "}
                  <Link to="/privacy" className="text-primary-600 hover:text-primary-500">
                    chính sách bảo mật
                  </Link>
                </label>
              </div>
              <ErrorMessage name="dongYDieuKhoan" component="div" className="form-error" />

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting || isLoading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? <div className="spinner w-5 h-5"></div> : "Đăng ký"}
                </button>
              </div>

              <div className="text-center">
                <span className="text-sm text-gray-600">
                  Đã có tài khoản?{" "}
                  <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                    Đăng nhập ngay
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

export default RegisterPage

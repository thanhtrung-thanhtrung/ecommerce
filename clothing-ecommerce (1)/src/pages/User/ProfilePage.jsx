import { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useShop } from "../../contexts/ShopContext";
import { toast } from "react-toastify";

const ProfilePage = () => {
  const { user, loading, updateProfile, changePassword, getProfile } = useShop();
  const [activeTab, setActiveTab] = useState("profile");
  const [isUpdating, setIsUpdating] = useState(false);

  const profileValidationSchema = Yup.object({
    hoTen: Yup.string()
      .min(2, "Họ tên phải có ít nhất 2 ký tự")
      .required("Vui lòng nhập họ tên"),
    soDienThoai: Yup.string()
      .matches(/^0\d{9}$/, "Số điện thoại Việt Nam phải bắt đầu bằng 0 và có đúng 10 số")
      .required("Vui lòng nhập số điện thoại"),
    diaChi: Yup.string()
      .min(10, "Địa chỉ phải có ít nhất 10 ký tự")
      .required("Vui lòng nhập địa chỉ"),
  });

  const passwordValidationSchema = Yup.object({
    matKhauCu: Yup.string().required("Vui lòng nhập mật khẩu cũ"),
    matKhauMoi: Yup.string()
      .min(6, "Mật khẩu phải có ít nhất 6 ký tự")
      .required("Vui lòng nhập mật khẩu mới"),
    xacNhanMatKhau: Yup.string()
      .oneOf([Yup.ref("matKhauMoi"), null], "Mật khẩu xác nhận không khớp")
      .required("Vui lòng xác nhận mật khẩu"),
  });

  const handleUpdateProfile = async (values) => {
    setIsUpdating(true);
    try {
      await updateProfile(values);
      toast.success("Cập nhật thông tin thành công!");
      await getProfile();
    } catch (error) {
      toast.error(error?.message || "Cập nhật thất bại");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async (values, { resetForm, setErrors }) => {
    setIsUpdating(true);
    try {
      await changePassword(values);
      toast.success("Đổi mật khẩu thành công!");
      resetForm();
    } catch (error) {
      // Nếu API trả về lỗi dạng { errors: [ { path, msg } ] }
      if (error && error.errors && Array.isArray(error.errors)) {
        const fieldErrors = {};
        error.errors.forEach((err) => {
          if (err.path && err.msg) fieldErrors[err.path] = err.msg;
        });
        setErrors(fieldErrors);
      } else {
        toast.error(error?.message || "Đổi mật khẩu thất bại");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    getProfile();
    // eslint-disable-next-line
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-center">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">
        Thông tin cá nhân
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👤</span>
              </div>
              <h3 className="font-semibold text-gray-800">{user?.HoTen}</h3>
              <p className="text-gray-600 text-sm">{user?.Email}</p>
            </div>

            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab("profile")}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${activeTab === "profile"
                  ? "bg-primary-100 text-primary-600"
                  : "text-gray-700 hover:bg-gray-100"
                  }`}
              >
                Thông tin cá nhân
              </button>
              <button
                onClick={() => setActiveTab("password")}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${activeTab === "password"
                  ? "bg-primary-100 text-primary-600"
                  : "text-gray-700 hover:bg-gray-100"
                  }`}
              >
                Đổi mật khẩu
              </button>
              <button
                onClick={() => setActiveTab("addresses")}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${activeTab === "addresses"
                  ? "bg-primary-100 text-primary-600"
                  : "text-gray-700 hover:bg-gray-100"
                  }`}
              >
                Địa chỉ giao hàng
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeTab === "profile" && (
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                Cập nhật thông tin
              </h2>
              <Formik
                initialValues={{
                  hoTen: user?.HoTen || "",
                  soDienThoai: user?.SDT || "",
                  diaChi: user?.DiaChi || "",
                }}
                validationSchema={profileValidationSchema}
                onSubmit={handleUpdateProfile}
                enableReinitialize
              >
                {({ isSubmitting }) => (
                  <Form className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="form-label">Họ và tên</label>
                        <Field name="hoTen" className="form-input" />
                        <ErrorMessage
                          name="hoTen"
                          component="div"
                          className="form-error"
                        />
                      </div>
                      <div>
                        <label className="form-label">Email</label>
                        <input
                          value={user?.Email || ""}
                          disabled
                          className="form-input bg-gray-100"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          Email không thể thay đổi
                        </p>
                      </div>
                      <div>
                        <label className="form-label">Số điện thoại</label>
                        <Field name="soDienThoai" className="form-input" />
                        <ErrorMessage
                          name="soDienThoai"
                          component="div"
                          className="form-error"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="form-label">Địa chỉ</label>
                        <Field name="diaChi" className="form-input" />
                        <ErrorMessage
                          name="diaChi"
                          component="div"
                          className="form-error"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmitting || isUpdating}
                        className="btn-primary"
                      >
                        {isUpdating ? "Đang cập nhật..." : "Cập nhật"}
                      </button>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          )}

          {activeTab === "password" && (
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                Đổi mật khẩu
              </h2>
              <Formik
                initialValues={{
                  matKhauCu: "",
                  matKhauMoi: "",
                  xacNhanMatKhau: "",
                }}
                validationSchema={passwordValidationSchema}
                onSubmit={handleChangePassword}
              >
                {({ isSubmitting }) => (
                  <Form className="space-y-6">
                    <div>
                      <label className="form-label">Mật khẩu cũ</label>
                      <Field
                        name="matKhauCu"
                        type="password"
                        className="form-input"
                      />
                      <ErrorMessage
                        name="matKhauCu"
                        component="div"
                        className="form-error"
                      />
                    </div>
                    <div>
                      <label className="form-label">Mật khẩu mới</label>
                      <Field
                        name="matKhauMoi"
                        type="password"
                        className="form-input"
                      />
                      <ErrorMessage
                        name="matKhauMoi"
                        component="div"
                        className="form-error"
                      />
                    </div>
                    <div>
                      <label className="form-label">
                        Xác nhận mật khẩu mới
                      </label>
                      <Field
                        name="xacNhanMatKhau"
                        type="password"
                        className="form-input"
                      />
                      <ErrorMessage
                        name="xacNhanMatKhau"
                        component="div"
                        className="form-error"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmitting || isUpdating}
                        className="btn-primary"
                      >
                        {isUpdating ? "Đang cập nhật..." : "Đổi mật khẩu"}
                      </button>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          )}

          {activeTab === "addresses" && (
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                Địa chỉ giao hàng
              </h2>
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🏠</div>
                <p className="text-gray-600 mb-4">Địa chỉ hiện tại:</p>
                <p className="font-medium text-gray-800">
                  {user?.DiaChi || "Chưa có địa chỉ"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

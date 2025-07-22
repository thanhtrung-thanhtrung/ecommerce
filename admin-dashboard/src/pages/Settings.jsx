import React, { useEffect, useState } from 'react';
import { FiSettings } from 'react-icons/fi';
import axios from 'axios';

const Settings = () => {
    const [settings, setSettings] = useState([]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/test/danhsach');
                setSettings(response.data.data);
            } catch (error) {
                console.error('Error fetching settings:', error);
            }
        };
        fetchSettings();
    }, []);

    return (
        <div className=" overflow-scroll  max-h">


            <div class="-mt-6 bg-red-100">Kéo lên trên 24px</div>
            <div class="bg-blue-100">Nền màu xanh nhạt</div>
            <div class="p-6 bg-blue-100">Có padding 24px xung quanh</div>
            <div class="px-8 py-4 bg-green-100">Padding ngang 32px, dọc 16px</div>
            <div class="w-64 mx-auto bg-yellow-100">Tự căn giữa theo chiều ngang</div>

            <div class="flex flex-col md:flex-row">

                <div class="w-full md:w-1/3 bg-gray-200 p-4">Sidebar</div>

                <div class="flex-1 bg-white p-4">Content</div>
            </div>
            <p class="text-base md:text-xl lg:text-3xl">
                Tự động to dần theo màn hình
            </p>
            <div class="bg-red-300 md:bg-green-300 lg:bg-blue-300">
                Màu nền đổi theo màn hình
            </div>
            <div class="flex flex-col md:flex-row gap-4">
                <div class="w-full md:w-1/3 bg-gray-200 p-4">Sidebar</div>
                <div class="w-full md:flex-1 bg-white p-4 disabled:opacity-40     " disabled>Content</div>
            </div>
            <input class=" flex justify-center border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-900" />
            <button class="bg-gray-400 text-white px-4 py-2 rounded disabled:opacity-50" disabled>
                Đang xử lý...
            </button>


            <p class="italic">Chữ nghiêng   </p>
            <p class="underline">Chữ gạch chân</p>
            <p class="line-through">Chữ gạch ngang</p>
            <p class="uppercase">Chữ in hoa</p>
            <p class="lowercase">Chữ thường</p>
            <p class="capitalize">Chữ viết hoa chữ đầu</p>
            <p className=' text-red-950'>tran thanh trung </p>
            <div className=' flex justify-center'><button class="    gap-100
             bg-red-500  hover:bg-red-700 text-white px-4 py-2 rounded">
                Xóa
            </button>
            </div>
            <div class=" flex justify-center bg-gradient-to-r from-blue-400 to-purple-500 text-white p-6">
                Gradient từ trái qua phải
            </div>
            <div class="bg-white text-black dark:bg-gray-900 dark:text-white">
                Giao diện sáng & tối
            </div>

            <div class="flex justify-between">
                <div class="bg-red-200 p-4">Căn trái</div>
                <div class="bg-green-200 p-4">Căn phải</div>
                <div class="bg-blue-200 p-4">Căn giữa</div>

                <div class="bg-yellow-200 p-4">Căn đều</div><button class="bg-blue-500 active:bg-blue-700">Click và giữ</button>

            </div>
            <button class="bg-red-500 hover:bg-red-700 text-white px-4 py-2 rounded transition duration-300 ease-in-out">
                Hover đổi màu mượt
            </button><header class="bg-white shadow-md px-4 py-2 flex justify-between items-center">
                <div class="text-xl font-bold">Logo</div>
                <nav class="hidden md:flex gap-4">
                    <a href="#">Trang chủ</a>
                    <a href="#">Sản phẩm</a>
                    <a href="#">Liên hệ</a>
                </nav>
            </header>
            <button class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                Mua ngay
            </button>
            <div class="bg-white rounded-lg shadow-md p-4 max-w-sm">
                <img src="..." class="w-full h-40 object-cover rounded-t-lg mb-4" />
                <h3 class="text-lg font-bold mb-2">Tên sản phẩm</h3>
                <p class="text-gray-600 text-sm mb-4">Mô tả ngắn gọn...</p>
                <button class="bg-green-500 text-white px-4 py-2 rounded">Mua ngay</button>
            </div>
            <label class="block mb-2 text-sm font-medium">Email</label>
            <input
                type="email"
                class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <span class="inline-block bg-purple-100 text-purple-700 text-xs font-semibold px-3 py-1 rounded-full">
                Mới ra mắt
            </span>
            {/* <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
  <div class="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
    <h2 class="text-xl font-bold mb-4">Thông báo</h2>
    <p class="mb-4">Bạn có chắc muốn xoá?</p>
    <div class="flex justify-end gap-2">
      <button class="bg-gray-200 px-4 py-2 rounded">Huỷ</button>
      <button class="bg-red-500 text-white px-4 py-2 rounded">Xoá</button>
    </div>
  </div>
</div> */}


            <div class="flex space-x-4">
                <div class="w-1/3 bg-red-200 p-4">Cột 1</div>
                <div class="w-1/3 bg-green-200 p-4">Cột 2</div>
                <div class="w-1/3 bg-blue-200 p-4">Cột 3</div>
            </div>
            <div class="animate-bounce w-6 h-6 bg-blue-500 rounded-full"></div>
            <div class="animate-spin w-6 h-6 bg-green-500 rounded-full"></div>
            <div class="animate-ping w-6 h-6 bg-yellow-500 rounded-full"></div>
            <div class="animate-pulse w-6 h-6 bg-purple-500 rounded-full"></div>

            <p class="line-clamp-1">
                Văn bản này rất dài nhưng chỉ hiển thị 2 dòng và phần còn lại sẽ bị ẩn...  Văn bản này rất dài nhưng chỉ hiển thị 2 dòng và phần còn lại sẽ bị ẩn...

                Văn bản này rất dài nhưng chỉ hiển thị 2 dòng và phần còn lại sẽ bị ẩn...

                Văn bản này rất dài nhưng chỉ hiển thị 2 dòng và phần còn lại sẽ bị ẩn...

                Văn bản này rất dài nhưng chỉ hiển thị 2 dòng và phần còn lại sẽ bị ẩn...
                Văn bản này rất dài nhưng chỉ hiển thị 2 dòng và phần còn lại sẽ bị ẩn...
                Văn bản này rất dài nhưng chỉ hiển thị 2 dòng và phần còn lại sẽ bị ẩn...
                Văn bản này rất dài nhưng chỉ hiển thị 2 dòng và phần còn lại sẽ bị ẩn...
                Văn bản này rất dài nhưng chỉ hiển thị 2 dòng và phần còn lại sẽ bị ẩn...
                Văn bản này rất dài nhưng chỉ hiển thị 2 dòng và phần còn lại sẽ bị ẩn...
                Văn bản này rất dài nhưng chỉ hiển thị 2 dòng và phần còn lại sẽ bị ẩn...
                Văn bản này rất dài nhưng chỉ hiển thị 2 dòng và phần còn lại sẽ bị ẩn...
                Văn bản này rất dài nhưng chỉ hiển thị 2 dòng và phần còn lại sẽ bị ẩn...

            </p>

            <p class="tracking-wider">C h ữ  r  ộ  n  g</p>
            <p class="tracking-tight">Chữ sát nhau</p>

            <p className=' leading-loose       '>khi ong mat troi thuoc dau me len ray con den truong nhin dang chom ho vang tieng hat hai ccon thang lan con cung nhau can nhau duc duoi ba thang lan buon hieu </p>
            <p class="leading-none">Dòng cách thoáng</p>
            <p class="leading-tight">Dòng cách chặt</p>
            <p class="leading-loose">Dòng cách rộng</p>
            <p class="text-justify">Văn bản căn đều hai bên. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
            <p class="text-sm">Chữ nhỏ</p>
            <p class="text-lg">Chữ lớn</p>
            <p class="text-xl">Chữ rất lớn</p>
            <p class="text-2xl">Chữ cực lớn</p>
            <p class="text-3xl">Chữ siêu lớn</p>
            <p class="text-4xl">Chữ khổng lồ</p>
            <p class="text-5xl">Chữ vũ trụ</p>
            <p class="text-6xl">Chữ vũ trụ siêu khổng lồ</p>
            <p class="text-7xl">Chữ vũ trụ siêu khổn  lồ nhất</p>




            <div class="flex items-center justify-between">
                <div class="bg-red-200 p-4">Căn đầu dòng</div>
                <div class="bg-green-200 p-4">Căn cuối dòng</div>
                <div class="bg-blue-200 p-4">Căn giữa dòng</div>







                <div class="bg-yellow-200 p-4">Căn đều dòng</div>
            </div>
            <div class="flex flex-wrap">
                <div class="w-1/2 bg-red-200 p-4">Chiếm 50% chiều rộng</div>
                <div class="w-1/3 bg-green-200 p-4 hover:text-red-800">Chi ếm 33.33% chiều rộng</div>
                <div class="w-1/4 bg-blue-200 p-4">Chiếm 25% chiều rộng</div>
                <div class="w-1/2 bg-yellow-200 p-4">Chiếm 50% chiều rộng</div>
            </div>

            <p class="text-center">Căn giữa</p>
            <p className='text-right text-blue-600'> thanh trung </p>
            <div class="grid grid-cols-3 gap-4">
                <div>1</div>
                <div>2</div>
                <div>3</div>
            </div>
            <div class="grid grid-cols-4 gap-2">
                <div class="col-span-2 bg-blue-200">Chiếm 2 cột</div>
                <div class="col-span-1 bg-green-200">Chiếm 1</div>
                <div class="col-span-1 bg-red-200">Chiếm 1</div>
            </div>

            <div class="flex">
                <div class="w-32 shrink-0 bg-red-300">Cố định</div>
                <div class="flex-1 bg-green-300">Giãn theo không gian</div>
            </div>

            <div class="sticky top-0 bg-white ">Thanh tiêu đề</div>
            <div class="flex justify-around shadow-amber-100 bg-blue-700 p-4">
                <div>Logo</div>
                <div>Menu</div>
            </div>
            <div class="flex items-center  h-32 bg-gray-100">
                <div class="bg-blue-500">Giữa chiều cao</div>
            </div>


            <div class="flex-shrink-0 bg-red-200 p-4">
                <div>1</div>
                <div>2</div>
            </div>

            <span className="block bg-red-200">Block span</span>
            <div class="inline bg-green-200">Inline div</div> <br />

            <div class="flex p-4">
                <div className='p-2' >1</div>
                <div className='p-2'>2</div>
            </div>
            <div class="grid grid-cols-3 gap-4">
                <div>1</div>
                <div>2</div>
                <div>3</div>
            </div>
            <div class="hidden">Sẽ không hiện</div>
            <div class="relative top-200 left-200">Dịch chuyển nhẹ</div>
            <div class="relative ">
                <div class="absolute  bottom-0 right-0"> phải</div>
            </div>
            <div class="fixed bottom-0 ">Luôn ở góc dưới</div>

            <div class="bg-gray-200 p-4">Nền xám</div>
            <p class="text-base">Tiêu đề lớn</p>
            <p class="font-extraboder ">Chữ đậm</p>

            <div class="absolute top-0 left-4 z-10">Nằm nổi phía trên</div>
            <div class="overflow-hidden max-h-20">...</div>
            <div class="overflow-sctrol max-h-20">...</div>
            <div class="overflow-auto max-h-20">...</div>

            <div class="box-border w-48 p-4 border">Tính padding vào</div>
            <div className='box-content  border'>hai con thang l </div>
            <p class="truncate w-48">Văn bản rất rất dàiVăn bản rất rất dàiVăn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...Văn bản rất rất dài...</p>
            <div class="shadow-lg p-4 bg-blue-50">Bóng lớn</div>
            <div class="shadow-md p-4 bg-blue-100">Bóng vừa</div>
            <div class="shadow-sm p-4 bg-blue-100">Bóng nhỏ</div>
            <div class="shadow p-4 bg-blue-100">Bóng mặc định</div>
            <div class="shadow-none p-4 bg-blue-100">Không bóng</div>
            <div class="aspect-video bg-gray-300">16:9 box</div>
            <div class="aspect-square bg-gray-300">1:1 box</div>
            <div class="aspect-auto bg-gray-300">Tự động</div>
            <span class="inline-block w-24 sm:w-40 md:w-60 lg:w-80 bg-yellow-200 h-10">Button</span>



        </div>

    )
};

export default Settings;

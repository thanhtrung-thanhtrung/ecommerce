import React from 'react';
import { Link } from 'react-router-dom';

const Hero = () => {
    return (
        <section
            className="relative h-[70vh] bg-cover bg-center flex items-center"
            style={{
                backgroundImage:
                    "url('https://res.cloudinary.com/db7jn3ooa/image/upload/v1751255472/pexels-rdne-5698854_orodfy.jpg')",
            }}
        >
            <div className="absolute inset-0 bg-black opacity-20"></div>
            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-2xl text-white">
                    <h1 className="text-5xl md:text-6xl font-bold mb-6">
                        Bộ Sưu Tập Giày Mới Nhất
                    </h1>
                    <p className="text-xl mb-8">
                        Khám phá những đôi giày thể thao chất lượng cao từ các thương hiệu
                        hàng đầu thế giới
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Link to="/products" className="btn-primary text-center">
                            Mua Ngay
                        </Link>
                        <Link to="/products?sale=true" className="btn-outline text-center">
                            Xem Khuyến Mãi
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;

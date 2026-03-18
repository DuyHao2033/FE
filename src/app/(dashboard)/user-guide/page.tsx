"use client";

import Link from 'next/link';
import { BookOpen, CircleCheck, FileText, Printer, ScanSearch, ShieldCheck, ArrowRight } from 'lucide-react';

const steps = [
  {
    title: '1. Đăng nhập',
    description: 'Dùng tài khoản được cấp sẵn để vào hệ thống. Nếu quên mật khẩu, hãy liên hệ người phụ trách.',
    icon: <ShieldCheck className="h-5 w-5 text-indigo-600" />,
  },
  {
    title: '2. Chọn việc cần làm',
    description: 'Ở thanh bên trái, chọn mục phù hợp như chứng chỉ, mẫu, người dùng hoặc lô cấp phát.',
    icon: <FileText className="h-5 w-5 text-blue-600" />,
  },
  {
    title: '3. Điền thông tin',
    description: 'Mỗi màn hình sẽ có các ô để nhập dữ liệu. Chỉ cần điền từng ô theo hướng dẫn trên màn hình.',
    icon: <CircleCheck className="h-5 w-5 text-green-600" />,
  },
  {
    title: '4. Xem lại trước khi lưu',
    description: 'Kiểm tra tên, mã, ngày tháng và các thông tin quan trọng trước khi bấm nút lưu hoặc cấp phát.',
    icon: <Printer className="h-5 w-5 text-amber-600" />,
  },
  {
    title: '5. Kiểm tra chứng chỉ',
    description: 'Nếu cần xác minh, dùng mã chứng chỉ để mở trang tra cứu và xem kết quả ngay.',
    icon: <ScanSearch className="h-5 w-5 text-emerald-600" />,
  },
];

const tips = [
  'Mỗi lần chỉ nên bấm một nút rồi chờ kết quả, tránh bấm liên tục.',
  'Nếu màn hình báo lỗi, đọc dòng thông báo màu đỏ ngay bên dưới hoặc phía trên form.',
  'Khi không chắc chắn, hãy quay lại trang trước và kiểm tra lại thông tin.',
  'Nên giữ lại mã chứng chỉ hoặc mã lô để tra cứu nhanh hơn sau này.',
];

export default function UserGuidePage() {
  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-sky-500 text-white shadow-lg">
        <div className="grid gap-6 px-6 py-8 md:grid-cols-[1.3fr_0.7fr] md:px-10 md:py-10">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-medium ring-1 ring-white/20">
              <BookOpen className="h-4 w-4" />
              Hướng dẫn sử dụng
            </div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Cách dùng hệ thống một cách dễ hiểu
            </h1>
            <p className="max-w-2xl text-base text-white/90 md:text-lg">
              Trang này được viết cho người không rành công nghệ. Chỉ cần làm từng bước, đọc kỹ tên nút và làm theo hướng dẫn là được.
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur">
            <p className="text-sm font-medium text-white/80">Mẹo nhanh</p>
            <p className="mt-2 text-lg font-semibold">Làm chậm một chút sẽ dễ đúng hơn.</p>
            <p className="mt-2 text-sm text-white/85">
              Nếu chưa chắc, hãy mở trang này và đọc lại phần “Các bước cơ bản”.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">Các bước cơ bản</h2>
          <div className="mt-6 space-y-4">
            {steps.map((step) => (
              <div key={step.title} className="flex gap-4 rounded-xl bg-gray-50 p-4">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-gray-200">
                  {step.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{step.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-gray-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">Lưu ý quan trọng</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-gray-600">
              {tips.map((tip) => (
                <li key={tip} className="flex gap-3">
                  <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-indigo-500" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-6">
            <h2 className="text-lg font-semibold text-indigo-900">Nếu vẫn chưa rõ</h2>
            <p className="mt-2 text-sm leading-6 text-indigo-800">
              Hãy nhờ người quản trị hoặc người phụ trách hệ thống. Bạn có thể nói rõ mình đang ở màn hình nào và đang muốn làm gì.
            </p>
            <Link
              href="/"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
            >
              Quay về trang tổng quan
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

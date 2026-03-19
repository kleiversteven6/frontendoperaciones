export default function Layout({ title, children, bgClass }) {
  return (
    <div className={`min-h-screen ${bgClass} flex flex-col items-center px-6 py-10`}>
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-semibold text-blue-200 mb-8 text-center drop-shadow">
          {title}
        </h1>
        <div className="bg-slate-900/80 shadow-2xl rounded-xl p-8 border border-blue-800">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function Button({ label, onClick, disabled, style, className = "" }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={style}
      className={`
        py-2 px-6 rounded-lg font-semibold transition shadow-md
        ${disabled
          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
          : "bg-[#458DFB] text-white hover:bg-[#004aad] active:transform active:scale-95"
        }
        ${className}
      `}
    >
      {label}
    </button>
  );
}

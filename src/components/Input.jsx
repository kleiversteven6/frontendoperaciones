export default function Input({ label, value, onChange, placeholder, onKeyDown }) {
  return (
    <div className="mb-4 w-full">
      <label className="block text-[#004aad] font-medium mb-2">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="w-full px-4 py-2 rounded-lg bg-white border-2 border-[#43B0FC] text-[#004aad] focus:outline-none focus:ring-2 focus:ring-[#6200a6] transition"
      />
    </div>
  );
}

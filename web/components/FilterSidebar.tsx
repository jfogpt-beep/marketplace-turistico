export function FilterSidebar() {
  return (
    <div className="bg-white border rounded-2xl p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Filtros</h3>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Precio</label>
        <div className="flex gap-2">
          <input type="number" placeholder="Min" className="w-full px-3 py-2 border rounded-lg text-sm" />
          <input type="number" placeholder="Max" className="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Duración</label>
        <select className="w-full px-3 py-2 border rounded-lg text-sm">
          <option value="">Cualquiera</option>
          <option value="1-3">1-3 días</option>
          <option value="4-7">4-7 días</option>
          <option value="8-14">8-14 días</option>
          <option value="15+">15+ días</option>
        </select>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Valoración</label>
        <div className="space-y-1">
          {[5, 4, 3].map((rating) => (
            <label key={rating} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" className="rounded" />
              <span>{"⭐".repeat(rating)} o más</span>
            </label>
          ))}
        </div>
      </div>

      <button className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition">
        Aplicar filtros
      </button>
    </div>
  );
}

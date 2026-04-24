"use client";

import { useState } from "react";

export function SearchBar() {
  const [destination, setDestination] = useState("");
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (destination) params.set("destination", destination);
    if (category) params.set("category", category);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    window.location.href = `/listings?${params.toString()}`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 md:p-6 max-w-3xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-500 mb-1">Destino</label>
          <input
            type="text"
            placeholder="¿A dónde quieres ir?"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Categoría</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition bg-white"
          >
            <option value="">Todas</option>
            <option value="vuelos-hotel">Vuelos + Hotel</option>
            <option value="solo-hotel">Solo Hotel</option>
            <option value="cruceros">Cruceros</option>
            <option value="circuitos">Circuitos</option>
            <option value="escapadas">Escapadas</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={handleSearch}
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition shadow-lg"
          >
            🔍 Buscar
          </button>
        </div>
      </div>
    </div>
  );
}

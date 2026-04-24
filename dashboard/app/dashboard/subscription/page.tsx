export default function SubscriptionPage() {
  const currentPlan = "professional";
  const plans = [
    { id: "basic", name: "Básico", price: "29€/mes", listings: 5, featured: 0, stats: false, current: currentPlan === "basic" },
    { id: "professional", name: "Profesional", price: "79€/mes", listings: 20, featured: 3, stats: true, current: currentPlan === "professional" },
    { id: "agency", name: "Agencia", price: "199€/mes", listings: "Ilimitado", featured: "Ilimitado", stats: true, current: currentPlan === "agency" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Suscripción</h1>

      {/* Current plan */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-600 font-medium">Plan actual</p>
            <p className="text-2xl font-bold text-gray-900">Profesional</p>
            <p className="text-sm text-gray-500">Renueva el 15 de mayo de 2026</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-blue-600">79€<span className="text-sm font-normal text-gray-500">/mes</span></p>
            <button className="text-sm text-red-600 hover:underline mt-1">Cancelar suscripción</button>
          </div>
        </div>
      </div>

      {/* Plan cards */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Cambiar plan</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`border rounded-xl p-6 ${
              plan.current ? "border-blue-500 ring-2 ring-blue-200" : ""
            }`}
          >
            <h3 className="font-semibold text-gray-900">{plan.name}</h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {plan.price}
            </p>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li>✅ {plan.listings} anuncios</li>
              <li>✅ {plan.featured} destacados</li>
              <li>{plan.stats ? "✅" : "❌"} Estadísticas avanzadas</li>
              <li>✅ Soporte por email</li>
            </ul>
            {plan.current ? (
              <button className="w-full mt-6 bg-gray-100 text-gray-500 py-2 rounded-lg font-medium cursor-default">
                Plan actual
              </button>
            ) : (
              <button className="w-full mt-6 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition">
                Cambiar a {plan.name}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Extras */}
      <div className="mt-8 bg-white border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Destacados individuales</h2>
        <div className="flex gap-4">
          <div className="flex-1 border rounded-lg p-4 text-center">
            <p className="font-medium text-gray-900">7 días</p>
            <p className="text-2xl font-bold text-blue-600">9€</p>
            <button className="mt-2 text-sm text-blue-600 hover:underline">Comprar</button>
          </div>
          <div className="flex-1 border rounded-lg p-4 text-center">
            <p className="font-medium text-gray-900">30 días</p>
            <p className="text-2xl font-bold text-blue-600">29€</p>
            <button className="mt-2 text-sm text-blue-600 hover:underline">Comprar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

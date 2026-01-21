"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="w-full">
      <div className="bg-gray-50 border shadow-md border-gray-200 rounded-xl mb-6">
        <div className="p-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800">
            <Icon icon="mdi:finance" className="inline mr-2" />
            Finance
          </h1>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === "overview"
              ? "bg-yellow-300 text-black"
              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          Vue d'ensemble
        </button>
        <button
          onClick={() => setActiveTab("transactions")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === "transactions"
              ? "bg-yellow-300 text-black"
              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          Transactions
        </button>
        <button
          onClick={() => setActiveTab("reports")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === "reports"
              ? "bg-yellow-300 text-black"
              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          Rapports
        </button>
      </div>

      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Revenus du jour</p>
                  <p className="text-2xl font-bold text-gray-800">0 CFA</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Icon icon="mdi:cash-plus" className="text-2xl text-green-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <Icon icon="mdi:trending-up" className="text-green-500 mr-1" />
                <span className="text-green-500">+0%</span>
                <span className="text-gray-500 ml-2">vs hier</span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Revenus du mois</p>
                  <p className="text-2xl font-bold text-gray-800">0 CFA</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Icon icon="mdi:calendar-month" className="text-2xl text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <Icon icon="mdi:trending-up" className="text-green-500 mr-1" />
                <span className="text-green-500">+0%</span>
                <span className="text-gray-500 ml-2">vs mois dernier</span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Courses completees</p>
                  <p className="text-2xl font-bold text-gray-800">0</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Icon icon="mdi:car-check" className="text-2xl text-yellow-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <Icon icon="mdi:trending-neutral" className="text-gray-500 mr-1" />
                <span className="text-gray-500">0 aujourd'hui</span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Commission totale</p>
                  <p className="text-2xl font-bold text-gray-800">0 CFA</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Icon icon="mdi:percent" className="text-2xl text-purple-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <Icon icon="mdi:information-outline" className="text-gray-500 mr-1" />
                <span className="text-gray-500">Commission: 15%</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Graphique des revenus</h3>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center text-gray-500">
                <Icon icon="mdi:chart-line" className="text-6xl mx-auto mb-2 text-gray-300" />
                <p>Aucune donnee disponible</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "transactions" && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Historique des transactions</h3>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Montant</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Statut</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-gray-100">
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  <Icon icon="mdi:receipt-text-outline" className="text-4xl mx-auto mb-2 text-gray-300" />
                  Aucune transaction disponible
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "reports" && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Generer un rapport</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Date de debut</label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Date de fin</label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Type de rapport</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-300">
                  <option value="revenue">Revenus</option>
                  <option value="courses">Courses</option>
                  <option value="commissions">Commissions</option>
                </select>
              </div>
            </div>
            <button className="mt-4 px-6 py-2 bg-yellow-300 text-black font-semibold rounded-lg hover:bg-yellow-400">
              <Icon icon="mdi:download" className="inline mr-1" />
              Telecharger le rapport
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Rapports recents</h3>
            <div className="text-center py-8 text-gray-500">
              <Icon icon="mdi:file-document-outline" className="text-4xl mx-auto mb-2 text-gray-300" />
              <p>Aucun rapport genere</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

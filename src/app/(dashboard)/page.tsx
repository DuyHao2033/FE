"use client";

import { useAuthStore } from '@/lib/store';
import { Award, FileText, CheckCircle, Clock } from 'lucide-react';

export default function DashboardOverview() {
  const { user } = useAuthStore();

  const stats = [
    { title: 'Total Issued', value: '1,248', icon: <Award className="text-indigo-600" />, change: '+12% from last month', changeType: 'positive' },
    { title: 'Templates', value: '12', icon: <FileText className="text-blue-600" />, change: '2 created this week', changeType: 'neutral' },
    { title: 'Active Verifications', value: '8,402', icon: <CheckCircle className="text-green-600" />, change: '+5% from last week', changeType: 'positive' },
    { title: 'Pending Batches', value: '3', icon: <Clock className="text-amber-600" />, change: 'Requiring attention', changeType: 'negative' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Welcome back, {user?.full_name}
        </h1>
        <div className="flex items-center gap-3">
            <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
              Role: {user?.role.toUpperCase()}
            </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.title} className="relative overflow-hidden rounded-xl bg-white px-4 pb-12 pt-5 shadow-sm sm:px-6 sm:pt-6 border border-gray-100 hover:shadow-md transition-shadow">
            <dt>
              <div className="absolute rounded-xl bg-gray-50 p-3 ring-1 ring-gray-100">
                {stat.icon}
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">{stat.title}</p>
            </dt>
            <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
              <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              <div className="absolute inset-x-0 bottom-0 bg-gray-50 px-4 py-4 sm:px-6">
                <div className="text-sm">
                  <span className={`font-medium ${stat.changeType === 'positive' ? 'text-green-600' : stat.changeType === 'negative' ? 'text-amber-600' : 'text-gray-500'}`}>
                    {stat.change}
                  </span>
                </div>
              </div>
            </dd>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
              <div className="flex flex-col items-center justify-center p-8 text-gray-500">
                  <Clock className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="text-sm">Fetching activity data...</p>
              </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                  <button className="w-full flex items-center gap-3 p-3 text-left bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors font-medium">
                      <Award size={20} />
                      Issue Single Certificate
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 text-left border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium">
                      <FileText size={20} />
                      Create New Template
                  </button>
              </div>
          </div>
      </div>
    </div>
  );
}

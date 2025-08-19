import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../AxiosInctance/AxiosInctance';
import { ResponsiveContainer, LineChart, Line, XAxis, Tooltip, CartesianGrid, YAxis } from 'recharts';

const TABS = [
	{ key: 'overview', label: 'Overview' },
	{ key: 'user', label: 'User Analytics' },
	{ key: 'company', label: 'Company Analytics' },
	{ key: 'revenue', label: 'Revenue Analytics' },
];

const CARD_ICON = {
	users: (
		<svg className="w-8 h-8 text-pink2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
			<circle cx="12" cy="8" r="4" />
			<path d="M4 20v-2a4 4 0 014-4h8a4 4 0 014 4v2" />
		</svg>
	),
	companies: (
		<svg className="w-8 h-8 text-yellow" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
			<rect x="3" y="7" width="18" height="13" rx="2" />
			<path d="M16 3v4M8 3v4M3 10h18" />
		</svg>
	),
	revenue: (
		<svg className="w-8 h-8 text-selectGreen1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
			<path d="M12 8v8m0 0l-3-3m3 3l3-3" />
			<circle cx="12" cy="12" r="10" />
		</svg>
	),
};

// --- New: MiniLineChart using recharts (responsive wrapper handled outside)
const MiniLineChart = ({ data = [], stroke = '#7ee787' }) => {
	if (!Array.isArray(data) || data.length === 0) {
		return (
			<div className="h-10 w-full">
				{/* placeholder */}
				<div style={{ height: 40, width: '100%' }} />
			</div>
		);
	}
	return (
		<div className="h-10 w-full">
			<ResponsiveContainer width="100%" height="100%">
				<LineChart data={data}>
					<XAxis dataKey="date" hide />
					<Tooltip
						formatter={(value) => [value, 'value']}
						labelFormatter={(label) => `Date: ${label}`}
					/>
					<Line type="monotone" dataKey="value" stroke={stroke} strokeWidth={2} dot={false} />
				</LineChart>
			</ResponsiveContainer>
		</div>
	);
};

// --- New: FullChart for larger comfortable charts (responsive height)
const FullChart = ({ data = [], stroke = '#7ee787', title = '' }) => {
	if (!Array.isArray(data) || data.length === 0) {
		return (
			<div className="bg-grayDash rounded-2xl p-4">
				<h4 className="text-md font-radioCanada text-white mb-2">{title}</h4>
				<div className="flex items-center justify-center text-white2" style={{ height: 180 }}>
					No data
				</div>
			</div>
		);
	}
	return (
		<div className="bg-grayDash rounded-2xl p-4">
			<h4 className="text-md font-radioCanada text-white mb-2">{title}</h4>
			<div className="h-[180px] md:h-[220px] w-full">
				<ResponsiveContainer width="100%" height="100%">
					<LineChart data={data}>
						<CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
						<XAxis dataKey="date" tick={{ fontSize: 12 }} />
						<YAxis tick={{ fontSize: 12 }} />
						<Tooltip formatter={(v) => [v, 'value']} labelFormatter={(l) => `Date: ${l}`} />
						<Line type="monotone" dataKey="value" stroke={stroke} strokeWidth={2} dot={{ r: 2 }} />
					</LineChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
};

// helper: pick numeric value from object using preferredKey or first numeric key
const extractSeries = (arr, preferredKey) => {
	if (!Array.isArray(arr)) return [];
	return arr.map((item) => {
		let value = null;
		if (preferredKey && typeof item[preferredKey] === 'number') value = item[preferredKey];
		else {
			// find first numeric property other than date
			for (const k of Object.keys(item)) {
				if (k === 'date') continue;
				if (typeof item[k] === 'number') {
					value = item[k];
					break;
				}
			}
		}
		// fallback to 0
		if (value === null || typeof value !== 'number') value = 0;
		return { date: item.date, value };
	});
};

const AdminAnalytics = () => {
	const [activeTab, setActiveTab] = useState('overview');
	const [overviewAnalytics, setOverviewAnalytics] = useState(null);
	// New: growth/trend time-series for cards in overview (arrays of {date,value})
	const [overviewGrowth, setOverviewGrowth] = useState({
		users: [],
		companies: [],
		revenue: [],
	});
	const [userAnalytics, setUserAnalytics] = useState(null);
	const [companyAnalytics, setCompanyAnalytics] = useState(null);
	const [revenueAnalytics, setRevenueAnalytics] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	useEffect(() => {
		const token = localStorage.getItem('token');

		if (activeTab === 'overview') {
			// fetch overview + growth/trend series in parallel
			setLoading(true);
			setError('');
			(async () => {
				try {
					const overviewReq = axiosInstance.get('/admin/analytics/overview', {
						headers: { Authorization: `Bearer ${token}` },
					});
					const usersGrowthReq = axiosInstance.get('/admin/analytics/users/growth', {
						headers: { Authorization: `Bearer ${token}` },
					});
					const companiesGrowthReq = axiosInstance.get('/admin/analytics/companies/growth', {
						headers: { Authorization: `Bearer ${token}` },
					});
					// revenue uses "trend" endpoint
					const revenueTrendReq = axiosInstance.get('/admin/analytics/revenue/trends', {
						headers: { Authorization: `Bearer ${token}` },
					});

					const [overviewRes, usersGrowthRes, companiesGrowthRes, revenueTrendRes] = await Promise.allSettled(
						[overviewReq, usersGrowthReq, companiesGrowthReq, revenueTrendReq],
					);

					if (overviewRes.status === 'fulfilled') {
						setOverviewAnalytics(overviewRes.value.data);
					} else {
						setOverviewAnalytics(null);
						console.error('Overview fetch failed', overviewRes.reason);
						setError((prev) => prev || 'Failed to load overview analytics.');
					}

					// parse series into [{date, value}]
					if (usersGrowthRes.status === 'fulfilled' && Array.isArray(usersGrowthRes.value.data)) {
						const s = extractSeries(usersGrowthRes.value.data, 'newUsers');
						setOverviewGrowth((prev) => ({ ...prev, users: s }));
					} else {
						console.warn('Users growth fetch failed', usersGrowthRes.reason);
					}

					if (companiesGrowthRes.status === 'fulfilled' && Array.isArray(companiesGrowthRes.value.data)) {
						// try preferred key 'newCompanies', otherwise fallback
						const s = extractSeries(companiesGrowthRes.value.data, 'newCompanies');
						setOverviewGrowth((prev) => ({ ...prev, companies: s }));
					} else {
						console.warn('Companies growth fetch failed', companiesGrowthRes.reason);
					}

					if (revenueTrendRes.status === 'fulfilled' && Array.isArray(revenueTrendRes.value.data)) {
						// revenue data may use different numeric key; fallback to first numeric
						const s = extractSeries(revenueTrendRes.value.data);
						setOverviewGrowth((prev) => ({ ...prev, revenue: s }));
					} else {
						console.warn('Revenue trend fetch failed', revenueTrendRes.reason);
					}
				} catch (e) {
					console.error(e);
					setError('Failed to load overview analytics.');
				} finally {
					setLoading(false);
				}
			})();
		}

		// --- changed: fetch both summary + growth for 'user' tab
		if (activeTab === 'user') {
			setLoading(true);
			setError('');
			(async () => {
				try {
					const summaryReq = axiosInstance.get('/admin/analytics/users', {
						headers: { Authorization: `Bearer ${token}` },
					});
					const growthReq = axiosInstance.get('/admin/analytics/users/growth', {
						headers: { Authorization: `Bearer ${token}` },
					});

					const [summaryRes, growthRes] = await Promise.allSettled([summaryReq, growthReq]);

					if (summaryRes.status === 'fulfilled') {
						setUserAnalytics(summaryRes.value.data);
					} else {
						setUserAnalytics(null);
						setError((prev) => prev || 'Failed to load user analytics.');
					}

					if (growthRes.status === 'fulfilled' && Array.isArray(growthRes.value.data)) {
						const s = extractSeries(growthRes.value.data, 'newUsers');
						setOverviewGrowth((prev) => ({ ...prev, users: s }));
					} else {
						console.warn('User growth fetch failed', growthRes.reason);
					}
				} catch (e) {
					console.error(e);
					setError('Failed to load user analytics.');
				} finally {
					setLoading(false);
				}
			})();
		}

		// --- changed: fetch both summary + growth for 'company' tab
		if (activeTab === 'company') {
			setLoading(true);
			setError('');
			(async () => {
				try {
					const summaryReq = axiosInstance.get('/admin/analytics/companies', {
						headers: { Authorization: `Bearer ${token}` },
					});
					const growthReq = axiosInstance.get('/admin/analytics/companies/growth', {
						headers: { Authorization: `Bearer ${token}` },
					});

					const [summaryRes, growthRes] = await Promise.allSettled([summaryReq, growthReq]);

					if (summaryRes.status === 'fulfilled') {
						setCompanyAnalytics(summaryRes.value.data);
					} else {
						setCompanyAnalytics(null);
						setError((prev) => prev || 'Failed to load company analytics.');
					}

					if (growthRes.status === 'fulfilled' && Array.isArray(growthRes.value.data)) {
						const s = extractSeries(growthRes.value.data, 'newCompanies');
						setOverviewGrowth((prev) => ({ ...prev, companies: s }));
					} else {
						console.warn('Company growth fetch failed', growthRes.reason);
					}
				} catch (e) {
					console.error(e);
					setError('Failed to load company analytics.');
				} finally {
					setLoading(false);
				}
			})();
		}

		// --- changed: fetch both summary + trend for 'revenue' tab
		if (activeTab === 'revenue') {
			setLoading(true);
			setError('');
			(async () => {
				try {
					const summaryReq = axiosInstance.get('/admin/analytics/revenue', {
						headers: { Authorization: `Bearer ${token}` },
					});
					const trendReq = axiosInstance.get('/admin/analytics/revenue/trends', {
						headers: { Authorization: `Bearer ${token}` },
					});

					const [summaryRes, trendRes] = await Promise.allSettled([summaryReq, trendReq]);

					if (summaryRes.status === 'fulfilled') {
						setRevenueAnalytics(summaryRes.value.data);
					} else {
						setRevenueAnalytics(null);
						setError((prev) => prev || 'Failed to load revenue analytics.');
					}

					if (trendRes.status === 'fulfilled' && Array.isArray(trendRes.value.data)) {
						const s = extractSeries(trendRes.value.data); // revenue may use different keys
						setOverviewGrowth((prev) => ({ ...prev, revenue: s }));
					} else {
						console.warn('Revenue trend fetch failed', trendRes.reason);
					}
				} catch (e) {
					console.error(e);
					setError('Failed to load revenue analytics.');
				} finally {
					setLoading(false);
				}
			})();
		}
	}, [activeTab]);

	// small helper to compute percent change from parsed series
	const percentChange = (series) => {
		if (!Array.isArray(series) || series.length < 2) return null;
		const first = series[0].value || 0;
		const last = series[series.length - 1].value || 0;
		const pct = ((last - first) / (first || 1)) * 100;
		return pct;
	};

	return (
		<div className="w-full">
			<h2 className="text-2xl font-radioCanada text-white mb-6">Analytics</h2>

			{/* Tabs: wrap on small screens */}
			<div className="flex flex-wrap gap-3 mb-6">
				{TABS.map((tab) => (
					<button
						key={tab.key}
						className={`px-4 py-2 rounded-xl font-radioCanada text-sm transition-colors ${
							activeTab === tab.key ? 'bg-pink2 text-white font-bold' : 'bg-grayDash text-white2 hover:bg-gray3'
						}`}
						onClick={() => setActiveTab(tab.key)}
					>
						{tab.label}
					</button>
				))}
			</div>

			<div>
				{activeTab === 'overview' && (
					<div>
						{loading && <LoadingOverview />}
						{error && <div className="text-red-400">{error}</div>}
						{!loading && !error && overviewAnalytics && (
							<div className="space-y-6 mb-8">
								{/* Users: card + wider chart side-by-side on md; stack on mobile */}
								<div className="flex flex-col md:flex-row gap-6 items-start">
									<div className="w-full md:w-1/3">
										<div className="bg-grayDash rounded-2xl px-4 md:px-8 py-6 md:py-8 flex flex-col items-center relative overflow-hidden group">
											<div className="absolute top-4 right-4 opacity-30 group-hover:opacity-60 transition">
												{CARD_ICON.users}
											</div>
											<h4 className="text-lg font-radioCanada text-white mb-2">Users</h4>
											<div className="flex flex-col gap-2 text-white2 w-full">
												<div className="flex justify-between">
													<span>Total</span>
													<span className="font-bold text-white">
														{overviewAnalytics.users.total}
													</span>
												</div>
												<div className="flex justify-between">
													<span>Active</span>
													<span className="font-bold text-selectGreen1">
														{overviewAnalytics.users.active}
													</span>
												</div>
												<div className="flex justify-between">
													<span>Inactive</span>
													<span className="font-bold text-selectRed1">
														{overviewAnalytics.users.inactive}
													</span>
												</div>
												<div className="flex justify-between">
													<span>Admins</span>
													<span className="font-bold text-yellow">
														{overviewAnalytics.users.admin}
													</span>
												</div>
												<div className="flex justify-between">
													<span>New This Month</span>
													<span className="font-bold text-white">
														{overviewAnalytics.users.newThisMonth}
													</span>
												</div>
												<div className="flex justify-between">
													<span>New This Week</span>
													<span className="font-bold text-white">
														{overviewAnalytics.users.newThisWeek}
													</span>
												</div>
												<div className="flex justify-between">
													<span>Growth Rate</span>
													<span className="font-bold text-selectGreen1">
														{overviewAnalytics.users.growthRate}%
													</span>
												</div>

												{/* Recharts mini chart and percent change */}
												<div className="w-full mt-3 flex items-center justify-between">
													<div className="w-36 md:w-[140px] flex-shrink-0">
														<MiniLineChart data={overviewGrowth.users} stroke="#7ee787" />
													</div>
													<div className="text-sm text-white2 text-right ml-4 flex-1">
														{overviewGrowth.users && overviewGrowth.users.length > 1 ? (
															(() => {
																const pct = percentChange(overviewGrowth.users);
																const sign = pct >= 0 ? '+' : '';
																const cls = pct >= 0 ? 'text-selectGreen1 font-bold' : 'text-selectRed1 font-bold';
																return <div className={cls}>{sign + pct.toFixed(1)}%</div>;
															})()
														) : (
															<div className="text-white2">No trend</div>
														)}
													</div>
												</div>
											</div>
										</div>
									</div>

									<div className="w-full md:w-2/3">
										<FullChart title="Users - Last 30 days" data={overviewGrowth.users} stroke="#7ee787" />
									</div>
								</div>

								{/* Companies: card + wider chart */}
								<div className="flex flex-col md:flex-row gap-6 items-start">
									<div className="w-full md:w-1/3">
										<div className="bg-grayDash rounded-2xl px-4 md:px-8 py-6 md:py-8 flex flex-col items-center relative overflow-hidden group">
											<div className="absolute top-4 right-4 opacity-30 group-hover:opacity-60 transition">
												{CARD_ICON.companies}
											</div>
											<h4 className="text-lg font-radioCanada text-white mb-2">Companies</h4>
											<div className="flex flex-col gap-2 text-white2 w-full">
												<div className="flex justify-between">
													<span>Total</span>
													<span className="font-bold text-white">
														{overviewAnalytics.companies.total}
													</span>
												</div>
												<div className="flex justify-between">
													<span>Active</span>
													<span className="font-bold text-selectGreen1">
														{overviewAnalytics.companies.active}
													</span>
												</div>
												<div className="flex justify-between">
													<span>Blocked</span>
													<span className="font-bold text-selectRed1">
														{overviewAnalytics.companies.blocked}
													</span>
												</div>
												<div className="flex justify-between">
													<span>New This Month</span>
													<span className="font-bold text-white">
														{overviewAnalytics.companies.newThisMonth}
													</span>
												</div>
												<div className="flex justify-between">
													<span>New This Week</span>
													<span className="font-bold text-white">
														{overviewAnalytics.companies.newThisWeek}
													</span>
												</div>
												<div className="flex justify-between">
													<span>Growth Rate</span>
													<span className="font-bold text-selectGreen1">
														{overviewAnalytics.companies.growthRate}%
													</span>
												</div>

												{/* Recharts mini chart */}
												<div className="w-full mt-3 flex items-center justify-between">
													<div className="w-36 md:w-[140px] flex-shrink-0">
														<MiniLineChart data={overviewGrowth.companies} stroke="#ffd166" />
													</div>
													<div className="text-sm text-white2 text-right ml-4 flex-1">
														{overviewGrowth.companies && overviewGrowth.companies.length > 1 ? (
															(() => {
																const pct = percentChange(overviewGrowth.companies);
																const sign = pct >= 0 ? '+' : '';
																const cls = pct >= 0 ? 'text-selectGreen1 font-bold' : 'text-selectRed1 font-bold';
																return <div className={cls}>{sign + pct.toFixed(1)}%</div>;
															})()
														) : (
															<div className="text-white2">No trend</div>
														)}
													</div>
												</div>
											</div>
										</div>
									</div>

									<div className="w-full md:w-2/3">
										<FullChart title="Companies - Last 30 days" data={overviewGrowth.companies} stroke="#ffd166" />
									</div>
								</div>

								{/* Revenue: card + wider chart */}
								<div className="flex flex-col md:flex-row gap-6 items-start">
									<div className="w-full md:w-1/3">
										<div className="bg-grayDash rounded-2xl px-4 md:px-8 py-6 md:py-8 flex flex-col items-center relative overflow-hidden group">
											<div className="absolute top-4 right-4 opacity-30 group-hover:opacity-60 transition">
												{CARD_ICON.revenue}
											</div>
											<h4 className="text-lg font-radioCanada text-white mb-2">Revenue</h4>
											<div className="flex flex-col gap-2 text-white2 w-full">
												<div className="flex justify-between">
													<span>Total</span>
													<span className="font-bold text-white">
														${overviewAnalytics.revenue.total}
													</span>
												</div>
												<div className="flex justify-between">
													<span>Monthly</span>
													<span className="font-bold text-selectGreen1">
														${overviewAnalytics.revenue.monthly}
													</span>
												</div>
												<div className="flex justify-between">
													<span>Annual</span>
													<span className="font-bold text-white">
														${overviewAnalytics.revenue.annual}
													</span>
												</div>
												<div className="flex justify-between">
													<span>Average Transaction</span>
													<span className="font-bold text-yellow">
														${overviewAnalytics.revenue.averageTransaction}
													</span>
												</div>
												<div className="flex justify-between">
													<span>Success Rate</span>
													<span className="font-bold text-selectGreen1">
														{overviewAnalytics.revenue.successRate}%
													</span>
												</div>
												<div className="flex justify-between">
													<span>Growth Rate</span>
													<span className="font-bold text-selectGreen1">
														{overviewAnalytics.revenue.growthRate}%
													</span>
												</div>

												{/* Recharts mini chart */}
												<div className="w-full mt-3 flex items-center justify-between">
													<div className="w-36 md:w-[140px] flex-shrink-0">
														<MiniLineChart data={overviewGrowth.revenue} stroke="#8fe3d1" />
													</div>
													<div className="text-sm text-white2 text-right ml-4 flex-1">
														{overviewGrowth.revenue && overviewGrowth.revenue.length > 1 ? (
															(() => {
																const pct = percentChange(overviewGrowth.revenue);
																const sign = pct >= 0 ? '+' : '';
																const cls = pct >= 0 ? 'text-selectGreen1 font-bold' : 'text-selectRed1 font-bold';
																return <div className={cls}>{sign + pct.toFixed(1)}%</div>;
															})()
														) : (
															<div className="text-white2">No trend</div>
														)}
													</div>
												</div>

												<div className="mt-3 text-xs text-white2">
													Last updated: {new Date(overviewAnalytics.timestamp).toLocaleString()}
												</div>
											</div>
										</div>
									</div>

									<div className="w-full md:w-2/3">
										<FullChart title="Revenue - Last 30 days" data={overviewGrowth.revenue} stroke="#8fe3d1" />
									</div>
								</div>
							</div>
						)}
					</div>
				)}
				{activeTab === 'user' && (
					<div>
						{loading && <LoadingRow title="Users" />}
						{error && <div className="text-red-400">{error}</div>}
						{!loading && !error && userAnalytics && (
							<div className="flex flex-col md:flex-row gap-6 items-start mb-8">
								<div className="w-full md:w-1/3">
									<div className="bg-grayDash rounded-2xl px-4 md:px-8 py-6 md:py-8 flex flex-col items-center relative overflow-hidden group">
										<div className="absolute top-4 right-4 opacity-30 group-hover:opacity-60 transition">
											{CARD_ICON.users}
										</div>
										<h4 className="text-lg font-radioCanada text-white mb-2">Users</h4>
										<div className="flex flex-col gap-2 text-white2 w-full">
											<div className="flex justify-between">
												<span>Total</span>
												<span className="font-bold text-white">{userAnalytics.total}</span>
											</div>
											<div className="flex justify-between">
												<span>Active</span>
												<span className="font-bold text-selectGreen1">{userAnalytics.active}</span>
											</div>
											<div className="flex justify-between">
												<span>Inactive</span>
												<span className="font-bold text-selectRed1">{userAnalytics.inactive}</span>
											</div>
											<div className="flex justify-between">
												<span>Admins</span>
												<span className="font-bold text-yellow">{userAnalytics.admin}</span>
											</div>
											<div className="flex justify-between">
												<span>New This Month</span>
												<span className="font-bold text-white">{userAnalytics.newThisMonth}</span>
											</div>
											<div className="flex justify-between">
												<span>New This Week</span>
												<span className="font-bold text-white">{userAnalytics.newThisWeek}</span>
											</div>
											<div className="flex justify-between">
												<span>Growth Rate</span>
												<span className="font-bold text-selectGreen1">{userAnalytics.growthRate}%</span>
											</div>

											{/* mini chart and pct */}
											<div className="w-full mt-3 flex items-center justify-between">
												<div className="w-36 md:w-[140px] flex-shrink-0">
													<MiniLineChart data={overviewGrowth.users} stroke="#7ee787" />
												</div>
												<div className="text-sm text-white2 text-right ml-4 flex-1">
													{overviewGrowth.users && overviewGrowth.users.length > 1 ? (
														(() => {
															const pct = percentChange(overviewGrowth.users);
															const sign = pct >= 0 ? '+' : '';
															const cls = pct >= 0 ? 'text-selectGreen1 font-bold' : 'text-selectRed1 font-bold';
															return <div className={cls}>{sign + pct.toFixed(1)}%</div>;
														})()
													) : (
														<div className="text-white2">No trend</div>
													)}
												</div>
											</div>
										</div>
									</div>
								</div>

								<div className="w-full md:w-2/3">
									<FullChart title="Users - Last 30 days" data={overviewGrowth.users} stroke="#7ee787" />
								</div>
							</div>
						)}
					</div>
				)}
				{activeTab === 'company' && (
					<div>
						{loading && <LoadingRow title="Companies" />}
						{error && <div className="text-red-400">{error}</div>}
						{!loading && !error && companyAnalytics && (
							<div className="flex flex-col md:flex-row gap-6 items-start mb-8">
								<div className="w-full md:w-1/3">
									<div className="bg-grayDash rounded-2xl px-4 md:px-8 py-6 md:py-8 flex flex-col items-center relative overflow-hidden group">
										<div className="absolute top-4 right-4 opacity-30 group-hover:opacity-60 transition">
											{CARD_ICON.companies}
										</div>
										<h4 className="text-lg font-radioCanada text-white mb-2">Companies</h4>
										<div className="flex flex-col gap-2 text-white2 w-full">
											<div className="flex justify-between">
												<span>Total</span>
												<span className="font-bold text-white">{companyAnalytics.total}</span>
											</div>
											<div className="flex justify-between">
												<span>Active</span>
												<span className="font-bold text-selectGreen1">{companyAnalytics.active}</span>
											</div>
											<div className="flex justify-between">
												<span>Blocked</span>
												<span className="font-bold text-selectRed1">{companyAnalytics.blocked}</span>
											</div>
											<div className="flex justify-between">
												<span>New This Month</span>
												<span className="font-bold text-white">{companyAnalytics.newThisMonth}</span>
											</div>
											<div className="flex justify-between">
												<span>New This Week</span>
												<span className="font-bold text-white">{companyAnalytics.newThisWeek}</span>
											</div>
											<div className="flex justify-between">
												<span>Growth Rate</span>
												<span className="font-bold text-selectGreen1">{companyAnalytics.growthRate}%</span>
											</div>

											{/* mini chart and pct */}
											<div className="w-full mt-3 flex items-center justify-between">
												<div className="w-36 md:w-[140px] flex-shrink-0">
													<MiniLineChart data={overviewGrowth.companies} stroke="#ffd166" />
												</div>
												<div className="text-sm text-white2 text-right ml-4 flex-1">
													{overviewGrowth.companies && overviewGrowth.companies.length > 1 ? (
														(() => {
															const pct = percentChange(overviewGrowth.companies);
															const sign = pct >= 0 ? '+' : '';
															const cls = pct >= 0 ? 'text-selectGreen1 font-bold' : 'text-selectRed1 font-bold';
															return <div className={cls}>{sign + pct.toFixed(1)}%</div>;
														})()
													) : (
														<div className="text-white2">No trend</div>
													)}
												</div>
											</div>
										</div>
									</div>
								</div>

								<div className="w-full md:w-2/3">
									<FullChart title="Companies - Last 30 days" data={overviewGrowth.companies} stroke="#ffd166" />
								</div>
							</div>
						)}
					</div>
				)}
				{activeTab === 'revenue' && (
					<div>
						{loading && <LoadingRow title="Revenue" />}
						{error && <div className="text-red-400">{error}</div>}
						{!loading && !error && revenueAnalytics && (
							<div className="flex flex-col md:flex-row gap-6 items-start mb-8">
								<div className="w-full md:w-1/3">
									<div className="bg-grayDash rounded-2xl px-4 md:px-8 py-6 md:py-8 flex flex-col items-center relative overflow-hidden group">
										<div className="absolute top-4 right-4 opacity-30 group-hover:opacity-60 transition">
											{CARD_ICON.revenue}
										</div>
										<h4 className="text-lg font-radioCanada text-white mb-2">Revenue</h4>
										<div className="flex flex-col gap-2 text-white2 w-full">
											<div className="flex justify-between">
												<span>Total</span>
												<span className="font-bold text-white">${revenueAnalytics.total}</span>
											</div>
											<div className="flex justify-between">
												<span>Monthly</span>
												<span className="font-bold text-selectGreen1">${revenueAnalytics.monthly}</span>
											</div>
											<div className="flex justify-between">
												<span>Annual</span>
												<span className="font-bold text-white">${revenueAnalytics.annual}</span>
											</div>
											<div className="flex justify-between">
												<span>Average Transaction</span>
												<span className="font-bold text-yellow">${revenueAnalytics.averageTransaction}</span>
											</div>
											<div className="flex justify-between">
												<span>Success Rate</span>
												<span className="font-bold text-selectGreen1">{revenueAnalytics.successRate}%</span>
											</div>
											<div className="flex justify-between">
												<span>Growth Rate</span>
												<span className="font-bold text-selectGreen1">{revenueAnalytics.growthRate}%</span>
											</div>

											{/* mini chart and pct */}
											<div className="w-full mt-3 flex items-center justify-between">
												<div className="w-36 md:w-[140px] flex-shrink-0">
													<MiniLineChart data={overviewGrowth.revenue} stroke="#8fe3d1" />
												</div>
												<div className="text-sm text-white2 text-right ml-4 flex-1">
													{overviewGrowth.revenue && overviewGrowth.revenue.length > 1 ? (
														(() => {
															const pct = percentChange(overviewGrowth.revenue);
															const sign = pct >= 0 ? '+' : '';
															const cls = pct >= 0 ? 'text-selectGreen1 font-bold' : 'text-selectRed1 font-bold';
															return <div className={cls}>{sign + pct.toFixed(1)}%</div>;
														})()
													) : (
														<div className="text-white2">No trend</div>
													)}
												</div>
											</div>

											<div className="mt-3 text-xs text-white2">
												Last updated: {new Date(revenueAnalytics.timestamp || overviewAnalytics?.timestamp).toLocaleString()}
											</div>
										</div>
									</div>
								</div>

								<div className="w-full md:w-2/3">
									<FullChart title="Revenue - Last 30 days" data={overviewGrowth.revenue} stroke="#8fe3d1" />
								</div>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

// Insert: Loading skeleton components (used when loading)
const LoadingRow = ({ title = 'Loading' }) => (
	<div className="flex flex-col md:flex-row gap-6 items-start animate-pulse">
		<div className="w-full md:w-1/3">
			<div className="bg-grayDash rounded-2xl px-4 md:px-8 py-6 md:py-8 space-y-3">
				<div className="h-6 w-36 bg-gray-600 rounded-md" />
				<div className="space-y-2 mt-2">
					<div className="h-4 bg-gray-600 rounded-md w-3/4" />
					<div className="h-4 bg-gray-600 rounded-md w-2/3" />
					<div className="h-4 bg-gray-600 rounded-md w-1/2" />
					<div className="h-4 bg-gray-600 rounded-md w-2/3" />
					<div className="h-4 bg-gray-600 rounded-md w-1/3" />
				</div>
			</div>
		</div>
		<div className="w-full md:w-2/3">
			<div className="bg-grayDash rounded-2xl p-4">
				<div className="h-6 w-48 bg-gray-600 rounded-md mb-3" />
				<div className="w-full rounded-md bg-gradient-to-r from-gray-700 to-gray-600" style={{ height: 180 }} />
			</div>
		</div>
	</div>
);

const LoadingOverview = () => (
	<div className="space-y-6 mb-8">
		<LoadingRow title="Users" />
		<LoadingRow title="Companies" />
		<LoadingRow title="Revenue" />
	</div>
);

export default AdminAnalytics;

const Task = require('../models/Task');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');

async function getTasks(req, res) {
	try {
		const { page, limit } = parsePagination(req.query);
		const q = (req.query.q || '').trim();
		const status = req.query.status;
		const sort = req.query.sort || '-createdAt';

		const filter = {};
		if (q) {
			const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
			filter.$or = [{ title: regex }, { description: regex }];
		}
		if (status) filter.status = status;

		const [total, items] = await Promise.all([
			Task.countDocuments(filter),
			Task.find(filter)
				.sort(sort)
				.skip((page - 1) * limit)
				.limit(limit)
				.lean()
		]);

		const meta = buildPaginationMeta(req, total, page, limit);

		return res.json({ meta, data: items });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: 'Server error' });
	}
}

module.exports = { getTasks };

const url = require('url');

function parsePagination(query) {
	const page = Math.max(1, parseInt(query.page, 10) || 1);
	const limit = Math.max(1, Math.min(100, parseInt(query.limit, 10) || 10));
	return { page, limit };
}

function buildPageLink(req, pageNum) {
	const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
	const parsed = url.parse(fullUrl, true);
	parsed.query.page = pageNum;
	// remove search to force using query object
	parsed.search = null;
	return url.format(parsed);
}

function buildPaginationMeta(req, total, page, limit) {
	const totalPages = Math.max(1, Math.ceil(total / limit));
	const meta = {
		total,
		page,
		limit,
		totalPages,
		links: {
			self: buildPageLink(req, page),
			first: buildPageLink(req, 1),
			last: buildPageLink(req, totalPages),
			next: page < totalPages ? buildPageLink(req, page + 1) : null,
			prev: page > 1 ? buildPageLink(req, page - 1) : null,
		},
	};
	return meta;
}

module.exports = { parsePagination, buildPaginationMeta };

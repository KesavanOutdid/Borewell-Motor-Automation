// BACKEND/utils/paginate.js
exports.paginate = (page, limit) => {
    const p = parseInt(page, 10) || 1;
    let l = parseInt(limit, 10) || 10;
    if (p < 1) page = 1;
    if (l < 1) l = 10;
    const skip = (p - 1) * l;
    return { page: p, limit: l, skip };
};

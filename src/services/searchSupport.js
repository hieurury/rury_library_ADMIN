const Features = function (name, route) {
    this.name = name;
    this.route = route;
}


const features = [
    new Features('Tổng quát', '/admin/'),
    new Features('Tất cả sách', '/admin/books'),
    new Features('Thêm sách mới', '/admin/books/add'),
    new Features('Danh mục sách', '/admin/categories'),
    new Features('Thêm danh mục sách', '/admin/categories/add'),
    new Features('Thêm Nhà xuất bản', '/admin/nxb/add'),
    new Features('Tất cả gói đăng ký', '/admin/packages'),
    new Features('Thêm gói đăng ký', '/admin/packages/add'),
]

console.log(features);

export default features;
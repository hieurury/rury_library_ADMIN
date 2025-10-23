const Features = (name, route) => {
    this.name = name;
    this.route = route;
}


const features = [
    new Features('Thêm Nhà xuất bản', '/admin/nxb/create'),
    new Features('Danh sách Nhà xuất bản', '/admin/nxb'),
]

export default features;
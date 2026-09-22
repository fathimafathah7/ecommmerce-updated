export interface Product {
    id: number | string,
    name: string,
    price: number,
    category: string,
    description: string,
    image: string[],
    rating: number,
    stock: number,
    maxQuantity: number
}

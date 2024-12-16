import { Injectable } from "@nestjs/common";
import { Events } from "common/base/events";
export const PRODUCT_EXCHANGE = 'product';
const getProductById = 'product.get';
const updateProduct = 'product.update';

@Injectable()
export class ProductEvents extends Events
{
    getProductById(id: string){
        return this.request<any>(getProductById, PRODUCT_EXCHANGE , id);
    }

    static GetProductById(){
        return Events.response(
            getProductById,
            PRODUCT_EXCHANGE,
            getProductById
        )
    }

    updateProduct(id: string, updateProductDto: any){
        return this.request<any>(updateProduct, PRODUCT_EXCHANGE , {id, updateProductDto});
    }

    static UpdateProduct(){
        return Events.response(
            updateProduct,
            PRODUCT_EXCHANGE,
            updateProduct
        )
    }
}
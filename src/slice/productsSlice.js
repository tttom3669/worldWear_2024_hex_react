import { createSlice } from '@reduxjs/toolkit';

export const productsSlice = createSlice({
  name: 'products',
  initialState: {
    productCategories: [
      {
        slug: 'women',
        title: 'women',
        categories: [
          {
            slug: 'top',
            title: '上衣',
            imageUrl: '/images/home/category-top.png',
          },
          {
            slug: 'jacket',
            title: '外套',
            imageUrl: '/images/home/category-jacket.png',
          },
          {
            slug: 'dress',
            title: '洋裝',
            imageUrl: '/images/home/category-dress.png',
          },
          {
            slug: 'pants',
            title: '褲子',
            imageUrl: '/images/home/category-pants.png',
          },
          {
            slug: 'skirts',
            title: '裙子',
            imageUrl: '/images/home/category-skirt.png',
          },
          {
            slug: 'accessories',
            title: '服飾配件',
            imageUrl: '/images/home/category-accessories.png',
          },
        ],
      },
      {
        slug: 'men',
        title: 'men',
        categories: [
          {
            slug: 'top',
            title: '上衣',
            imageUrl: '/images/home/category-top-m.png',
          },
          {
            slug: 'jacket',
            title: '外套',
            imageUrl: '/images/home/category-jacket-m.png',
          },
          {
            slug: 'pants',
            title: '褲子',
            imageUrl: '/images/home/category-pants-m.png',
          },
          {
            slug: 'accessories',
            title: '服飾配件',
            imageUrl: '/images/home/category-accessories-m.png',
          },
        ],
      },
    ],
  },
});

export const productCategories = (state) => state.products.productCategories;

export default productsSlice.reducer;

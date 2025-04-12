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
            imageUrl: '/images/home/category-top.webp',
            subCategories: [
              { slug: 'shirt', title: '襯衫' },
              { slug: 'knitwear', title: '針織衫' },
              { slug: 'tshirt', title: 'T恤' },
              { slug: 'casual', title: '休閒上衣' }
            ]
          },
          {
            slug: 'jacket',
            title: '外套',
            imageUrl: '/images/home/category-jacket.webp',
            subCategories: [
              { slug: 'jacket', title: '夾克外套' },
              { slug: 'coat', title: '大衣' },
              { slug: 'knitwear-jacket', title: '針織外套' },
              // { slug: 'leather-jacket', title: '仿皮外套' },
              { slug: 'suit-jacket', title: '西裝外套' },
              // { slug: 'functional-jacket', title: '機能外套' },
              // { slug: 'hoodie', title: '連帽外套' }
            ]
          },
          {
            slug: 'dress',
            title: '洋裝',
            imageUrl: '/images/home/category-dress.webp',
            subCategories: [
              { slug: 'dress', title: '洋裝' },
              { slug: 'long-dress', title: '長洋裝' },
              { slug: 'one-piece', title: '連衣裙' }
            ]
          },
          {
            slug: 'pants',
            title: '褲子',
            imageUrl: '/images/home/category-pants.webp',
            subCategories: [
              { slug: 'short-pants', title: '短褲' },
              { slug: 'skirt-pants', title: '褲裙' },
              { slug: 'long-pants', title: '長褲' }
            ]
          },
          {
            slug: 'skirts',
            title: '裙子',
            imageUrl: '/images/home/category-skirt.webp',
            subCategories: [
              { slug: 'short-skirt', title: '短裙' },
              { slug: 'denim-skirt', title: '牛仔裙' }
            ]
          },
          {
            slug: 'accessory',
            title: '配件',
            imageUrl: '/images/home/category-accessories.webp',
            subCategories: [
              { slug: 'hat', title: '帽子' },
              { slug: 'shawl', title: '披肩' },
              { slug: 'belt', title: '皮帶' },
              { slug: 'socks', title: '襪子' }
            ]
          },
          {
            slug: 'product-status',
            title: '狀態',
            imageUrl: '#',
            subCategories: [
              { slug: 'in-stock', title: '現貨' },
              { slug: 'pre-order', title: '預購' },
              { slug: 'restocking', title: '補貨中' }
            ]
          }
        ],
      },
      {
        slug: 'men',
        title: 'men',
        categories: [
          {
            slug: 'top',
            title: '上衣',
            imageUrl: '/images/home/category-top-m.webp',
            subCategories: [
              { slug: 'long-sleeve', title: '長袖' },
              { slug: 'short-sleeve', title: '短袖' }
            ]
          },
          {
            slug: 'jacket',
            title: '外套',
            imageUrl: '/images/home/category-jacket-m.webp',
            subCategories: [
              { slug: 'casual-jacket', title: '休閒外套' },
              { slug: 'jacket', title: '夾克外套' },
              { slug: 'long-jacket', title: '長版外套' },
              { slug: 'suit-jacket', title: '西裝外套' },
              { slug: 'functional-jacket', title: '機能外套' },
              { slug: 'hoodie', title: '連帽外套' }
            ]
          },
          {
            slug: 'pants',
            title: '褲子',
            imageUrl: '/images/home/category-pants-m.webp',
            subCategories: [
              { slug: 'jeans', title: '牛仔褲' },
              { slug: 'suit-pants', title: '西裝長褲' },
              { slug: 'wide-pants', title: '寬褲' },
              { slug: 'casual-pants', title: '休閒褲' },
              { slug: 'short-pants', title: '短褲' }
            ]
          },
          {
            slug: 'accessory',
            title: '配件',
            imageUrl: '/images/home/category-accessories-m.webp',
            subCategories: [
              { slug: 'hat', title: '帽子' },
              { slug: 'belt', title: '皮帶' },
              { slug: 'socks', title: '襪子' }
            ]
          },
          {
            slug: 'product-status',
            title: '狀態',
            imageUrl: '#',
            subCategories: [
              { slug: 'in-stock', title: '現貨' },
              { slug: 'pre-order', title: '預購' },
              { slug: 'restocking', title: '補貨中' }
            ]
          }
        ],
      },
    ],
  },
});

export const productCategories = (state) => state.products.productCategories;

export default productsSlice.reducer;
const data = globalThis._tangData || (globalThis._tangData = {
  products: [
    { id: "p1", name: "Fanta Orange", category: "Drinks", subcategory: "Soft Drinks", description: "Chilled Fanta Orange, 500ml bottle.", priceRWF: 1500, priceUSD: 1.20, image: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=600&q=80", availability: true },
    { id: "p2", name: "Fresh Mango Juice", category: "Drinks", subcategory: "Juices", description: "Freshly squeezed mango juice, served cold.", priceRWF: 2500, priceUSD: 2.00, image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=600&q=80", availability: true },
    { id: "p3", name: "Mineral Water 1L", category: "Drinks", subcategory: "Water", description: "Pure mineral water, 1 litre bottle.", priceRWF: 1000, priceUSD: 0.80, image: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=600&q=80", availability: true },
    { id: "p4", name: "Grilled Chicken & Rice", category: "Food", subcategory: "Meals", description: "Tender grilled chicken with seasoned rice and vegetables.", priceRWF: 8000, priceUSD: 6.50, image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80", availability: true },
    { id: "p5", name: "Beef Burger", category: "Food", subcategory: "Fast Food", description: "Juicy beef burger with fries on the side.", priceRWF: 6000, priceUSD: 4.80, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80", availability: true },
    { id: "p6", name: "Chocolate Cake Slice", category: "Food", subcategory: "Desserts", description: "Rich chocolate cake slice, freshly baked.", priceRWF: 3500, priceUSD: 2.80, image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80", availability: true },
    { id: "p7", name: "Standard Room (1 Night)", category: "Hospitality", subcategory: "Hotel Services", description: "Comfortable standard room with breakfast included.", priceRWF: 60000, priceUSD: 48.00, image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80", availability: true },
    { id: "p8", name: "Event Hall Booking", category: "Hospitality", subcategory: "Event Services", description: "Spacious hall for conferences, weddings and celebrations.", priceRWF: 200000, priceUSD: 160.00, image: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=600&q=80", availability: true },
    { id: "p9", name: "Catering Package", category: "Hospitality", subcategory: "Catering Services", description: "Full catering service for events up to 50 people.", priceRWF: 150000, priceUSD: 120.00, image: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=600&q=80", availability: true }
  ],
  orders: [],
  chats: {}
});
export default data;
import { useMemo } from 'react';
import { useMasterBatchTranslation } from '@/hooks/use-master-translation';

export const CART_TRANSLATION_STRINGS = [
  "Shopping Cart",
  "Please log in to view your shopping cart",
  "You need to be signed in to manage your cart and make purchases.",
  "Go to Home",
  "There was an error loading your cart",
  "Continue Shopping",
  "Your Cart is Empty",
  "Looks like you haven't added any items to your cart yet.",
  "Browse Products",
  "YOU ARE CHECKING OUT AS",
  "SHIPPING ADDRESS",
  "Where should we deliver to?",
  "Home Delivery",
  "1 - 2 business days",
  "Collect In-Store",
  "FIRST NAME",
  "SURNAME",
  "ADDRESS LINE 1",
  "Enter address line 2",
  "COUNTRY/REGION",
  "Belgium",
  "United Kingdom",
  "France",
  "Germany",
  "CITY",
  "POSTAL CODE",
  "This is a business address.",
  "MOBILE",
  "SMS delivery updates will be sent to this number.",
  "+32 Belgium",
  "+44 UK",
  "+33 France",
  "Add additional contact number.",
  "Save shipping address information to address book.",
  "DELIVERY METHOD",
  "Enter your postal code above to see shipping options.",
  "CONTINUE TO PACKAGING",
  "PACKAGING OPTIONS & GIFTING",
  "Signature Box, Signature box and Boutique Shopping bag",
  "PAYMENT",
  "Credit Card, PayPal, Klarna, Wire Transfer",
  "ORDER SUMMARY",
  "ITEM",
  "Your cart is empty",
  "Style",
  "Variation",
  "Standard",
  "QTY",
  "Subtotal",
  "Shipping",
  "€ 0 (DHL Express Worldwide)",
  "TOTAL",
  "VAT (Included)",
  "VIEW DETAILS",
  "You will be charged only at the time of shipment except for DIY orders where the full amount is charged at the time of the purchase.",
  "Send Cart as Gift",
  "Choose a recipient from the platform and add a personal message",
  "Gift Summary",
  "Items",
  "item",
  "items",
  "Total Value",
  "Shipping Cost",
  "Free",
  "Gift Total",
  "Select Recipient",
  "Search platform users...",
  "No users found",
  "No users available",
  "Personal Message",
  "Add a personal message (optional)...",
  "Cancel",
  "Sending Gift...",
  "Send Gift",
  "Error",
  "Failed to update quantity",
  "Item Removed",
  "The item was removed from your cart.",
  "Failed to remove item",
  "Gift Sent Successfully",
  "Your gift has been sent to the recipient",
  "Gift Send Failed",
  "Failed to send gift",
  "No Recipient Selected",
  "Please select a recipient for the gift",
  "Escrow Transaction Created",
  "Your secure payment has been initialized",
  "Failed to create escrow transaction",
];

export interface CartTranslations {
  shoppingCart: string;
  pleaseLogIn: string;
  signedInRequired: string;
  goToHome: string;
  errorLoading: string;
  continueShopping: string;
  yourCartIsEmpty: string;
  noItemsAdded: string;
  browseProducts: string;
  checkingOutAs: string;
  shippingAddress: string;
  deliverTo: string;
  homeDelivery: string;
  businessDays: string;
  collectInStore: string;
  firstName: string;
  surname: string;
  addressLine1: string;
  addressLine2: string;
  countryRegion: string;
  belgium: string;
  unitedKingdom: string;
  france: string;
  germany: string;
  city: string;
  postalCode: string;
  businessAddress: string;
  mobile: string;
  smsUpdates: string;
  phoneBelgium: string;
  phoneUK: string;
  phoneFrance: string;
  additionalContact: string;
  saveAddress: string;
  deliveryMethod: string;
  enterPostalCode: string;
  continueToPackaging: string;
  packagingOptions: string;
  signatureBox: string;
  payment: string;
  paymentMethods: string;
  orderSummary: string;
  item: string;
  cartEmpty: string;
  style: string;
  variation: string;
  standard: string;
  qty: string;
  subtotal: string;
  shipping: string;
  freeShipping: string;
  total: string;
  vatIncluded: string;
  viewDetails: string;
  chargeNotice: string;
  sendGift: string;
  chooseRecipient: string;
  giftSummary: string;
  items: string;
  itemSingular: string;
  itemsPlural: string;
  totalValue: string;
  shippingCost: string;
  free: string;
  giftTotal: string;
  selectRecipient: string;
  searchUsers: string;
  noUsersFound: string;
  noUsersAvailable: string;
  personalMessage: string;
  addMessage: string;
  cancel: string;
  sendingGift: string;
  sendGiftButton: string;
  error: string;
  failedUpdateQty: string;
  itemRemoved: string;
  itemRemovedDesc: string;
  failedRemove: string;
  giftSentSuccess: string;
  giftSentDesc: string;
  giftSendFailed: string;
  failedSendGift: string;
  noRecipient: string;
  selectRecipientMsg: string;
  escrowCreated: string;
  escrowInitialized: string;
  failedEscrow: string;
}

export function useCartTranslations(): CartTranslations {
  const { translations } = useMasterBatchTranslation(CART_TRANSLATION_STRINGS, 'high');
  
  return useMemo(() => ({
    shoppingCart: translations[0] || "Shopping Cart",
    pleaseLogIn: translations[1] || "Please log in to view your shopping cart",
    signedInRequired: translations[2] || "You need to be signed in to manage your cart and make purchases.",
    goToHome: translations[3] || "Go to Home",
    errorLoading: translations[4] || "There was an error loading your cart",
    continueShopping: translations[5] || "Continue Shopping",
    yourCartIsEmpty: translations[6] || "Your Cart is Empty",
    noItemsAdded: translations[7] || "Looks like you haven't added any items to your cart yet.",
    browseProducts: translations[8] || "Browse Products",
    checkingOutAs: translations[9] || "YOU ARE CHECKING OUT AS",
    shippingAddress: translations[10] || "SHIPPING ADDRESS",
    deliverTo: translations[11] || "Where should we deliver to?",
    homeDelivery: translations[12] || "Home Delivery",
    businessDays: translations[13] || "1 - 2 business days",
    collectInStore: translations[14] || "Collect In-Store",
    firstName: translations[15] || "FIRST NAME",
    surname: translations[16] || "SURNAME",
    addressLine1: translations[17] || "ADDRESS LINE 1",
    addressLine2: translations[18] || "Enter address line 2",
    countryRegion: translations[19] || "COUNTRY/REGION",
    belgium: translations[20] || "Belgium",
    unitedKingdom: translations[21] || "United Kingdom",
    france: translations[22] || "France",
    germany: translations[23] || "Germany",
    city: translations[24] || "CITY",
    postalCode: translations[25] || "POSTAL CODE",
    businessAddress: translations[26] || "This is a business address.",
    mobile: translations[27] || "MOBILE",
    smsUpdates: translations[28] || "SMS delivery updates will be sent to this number.",
    phoneBelgium: translations[29] || "+32 Belgium",
    phoneUK: translations[30] || "+44 UK",
    phoneFrance: translations[31] || "+33 France",
    additionalContact: translations[32] || "Add additional contact number.",
    saveAddress: translations[33] || "Save shipping address information to address book.",
    deliveryMethod: translations[34] || "DELIVERY METHOD",
    enterPostalCode: translations[35] || "Enter your postal code above to see shipping options.",
    continueToPackaging: translations[36] || "CONTINUE TO PACKAGING",
    packagingOptions: translations[37] || "PACKAGING OPTIONS & GIFTING",
    signatureBox: translations[38] || "Signature Box, Signature box and Boutique Shopping bag",
    payment: translations[39] || "PAYMENT",
    paymentMethods: translations[40] || "Credit Card, PayPal, Klarna, Wire Transfer",
    orderSummary: translations[41] || "ORDER SUMMARY",
    item: translations[42] || "ITEM",
    cartEmpty: translations[43] || "Your cart is empty",
    style: translations[44] || "Style",
    variation: translations[45] || "Variation",
    standard: translations[46] || "Standard",
    qty: translations[47] || "QTY",
    subtotal: translations[48] || "Subtotal",
    shipping: translations[49] || "Shipping",
    freeShipping: translations[50] || "€ 0 (DHL Express Worldwide)",
    total: translations[51] || "TOTAL",
    vatIncluded: translations[52] || "VAT (Included)",
    viewDetails: translations[53] || "VIEW DETAILS",
    chargeNotice: translations[54] || "You will be charged only at the time of shipment except for DIY orders where the full amount is charged at the time of the purchase.",
    sendGift: translations[55] || "Send Cart as Gift",
    chooseRecipient: translations[56] || "Choose a recipient from the platform and add a personal message",
    giftSummary: translations[57] || "Gift Summary",
    items: translations[58] || "Items",
    itemSingular: translations[59] || "item",
    itemsPlural: translations[60] || "items",
    totalValue: translations[61] || "Total Value",
    shippingCost: translations[62] || "Shipping Cost",
    free: translations[63] || "Free",
    giftTotal: translations[64] || "Gift Total",
    selectRecipient: translations[65] || "Select Recipient",
    searchUsers: translations[66] || "Search platform users...",
    noUsersFound: translations[67] || "No users found",
    noUsersAvailable: translations[68] || "No users available",
    personalMessage: translations[69] || "Personal Message",
    addMessage: translations[70] || "Add a personal message (optional)...",
    cancel: translations[71] || "Cancel",
    sendingGift: translations[72] || "Sending Gift...",
    sendGiftButton: translations[73] || "Send Gift",
    error: translations[74] || "Error",
    failedUpdateQty: translations[75] || "Failed to update quantity",
    itemRemoved: translations[76] || "Item Removed",
    itemRemovedDesc: translations[77] || "The item was removed from your cart.",
    failedRemove: translations[78] || "Failed to remove item",
    giftSentSuccess: translations[79] || "Gift Sent Successfully",
    giftSentDesc: translations[80] || "Your gift has been sent to the recipient",
    giftSendFailed: translations[81] || "Gift Send Failed",
    failedSendGift: translations[82] || "Failed to send gift",
    noRecipient: translations[83] || "No Recipient Selected",
    selectRecipientMsg: translations[84] || "Please select a recipient for the gift",
    escrowCreated: translations[85] || "Escrow Transaction Created",
    escrowInitialized: translations[86] || "Your secure payment has been initialized",
    failedEscrow: translations[87] || "Failed to create escrow transaction",
  }), [translations]);
}

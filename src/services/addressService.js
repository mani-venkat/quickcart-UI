
const getStorageKey = (userId) => `quickkart-addresses-${userId}`;

export const getAddresses = (userId) => {
  if (!userId) return [];

  try {
    return JSON.parse(
      localStorage.getItem(getStorageKey(userId)) || "[]"
    );
  } catch (error) {
    console.error("Unable to read addresses:", error);
    return [];
  }
};

const saveAddresses = (userId, addresses) => {
  localStorage.setItem(
    getStorageKey(userId),
    JSON.stringify(addresses)
  );
};

export const addAddress = (userId, address) => {
  const addresses = getAddresses(userId);

  const newAddress = {
    ...address,
    id: `ADDR${Date.now()}`,
    isDefault: addresses.length === 0 || address.isDefault === true,
  };

  const updatedAddresses = newAddress.isDefault
    ? addresses.map((item) => ({ ...item, isDefault: false }))
    : addresses;

  updatedAddresses.push(newAddress);
  saveAddresses(userId, updatedAddresses);

  return newAddress;
};

export const updateAddress = (userId, addressId, updatedData) => {
  const addresses = getAddresses(userId);

  const updatedAddresses = addresses.map((address) => ({
    ...address,
    ...(address.id === addressId ? updatedData : {}),
    ...(updatedData.isDefault && address.id !== addressId
      ? { isDefault: false }
      : {}),
  }));

  saveAddresses(userId, updatedAddresses);
  return updatedAddresses;
};

export const deleteAddress = (userId, addressId) => {
  const addresses = getAddresses(userId);
  const remaining = addresses.filter(
    (address) => address.id !== addressId
  );

  // If the default address was deleted, choose the first remaining address.
  if (addresses.some((item) => item.id === addressId && item.isDefault)) {
    if (remaining.length > 0) {
      remaining[0].isDefault = true;
    }
  }

  saveAddresses(userId, remaining);
  return remaining;
};

export const setDefaultAddress = (userId, addressId) => {
  const addresses = getAddresses(userId);

  const updatedAddresses = addresses.map((address) => ({
    ...address,
    isDefault: address.id === addressId,
  }));

  saveAddresses(userId, updatedAddresses);
  return updatedAddresses;
};

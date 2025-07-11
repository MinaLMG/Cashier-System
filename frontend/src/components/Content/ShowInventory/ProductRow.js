// Display unit prices in the UI
<td>{product.u_pharmacy_price?.toFixed(2) || "0.00"}</td>
<td>{product.u_walkin_price?.toFixed(2) || "0.00"}</td>

// When displaying volume prices, calculate them from unit prices
const baseVolume = product.values?.find(v => v.id === product.default_volume);
const volumeValue = baseVolume?.val || 1;

<td>{(product.u_pharmacy_price * volumeValue).toFixed(2) || "0.00"}</td>
<td>{(product.u_walkin_price * volumeValue).toFixed(2) || "0.00"}</td>
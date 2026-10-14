CREATE TYPE "FulfillmentStatus" AS ENUM ('PENDING', 'PREPARING', 'IN_TRANSIT', 'DELIVERED');

ALTER TABLE "OrderItem"
ADD COLUMN "fulfillmentStatus" "FulfillmentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "estimatedArrival" TIMESTAMP(3);

ALTER TABLE "Order"
ADD COLUMN "deliveryLabel" TEXT,
ADD COLUMN "deliveryStreet" TEXT,
ADD COLUMN "deliveryCity" TEXT,
ADD COLUMN "deliveryState" TEXT,
ADD COLUMN "deliveryZipCode" TEXT,
ADD COLUMN "deliveryCountry" TEXT;

UPDATE "Order" AS orders
SET
  "deliveryLabel" = addresses.label,
  "deliveryStreet" = addresses.street,
  "deliveryCity" = addresses.city,
  "deliveryState" = addresses.state,
  "deliveryZipCode" = addresses."zipCode",
  "deliveryCountry" = addresses.country
FROM "Address" AS addresses
WHERE orders."addressId" = addresses.id;

ALTER TABLE "Order"
ALTER COLUMN "deliveryLabel" SET NOT NULL,
ALTER COLUMN "deliveryStreet" SET NOT NULL,
ALTER COLUMN "deliveryCity" SET NOT NULL,
ALTER COLUMN "deliveryState" SET NOT NULL,
ALTER COLUMN "deliveryZipCode" SET NOT NULL,
ALTER COLUMN "deliveryCountry" SET NOT NULL;

const { prisma } = require("../config/db");

function validateAddress(address) {
  if (!address || typeof address !== "object") {
    return false;
  }

  return [
    address.label,
    address.street,
    address.city,
    address.state,
    address.zipCode,
    address.country,
  ].every((value) => typeof value === "string" && value.trim().length > 0);
}

async function createOrder(req, res, next) {
  try {
    const { addressId, address, paymentMethod = "CASH_ON_DELIVERY" } = req.body;

    if ((!addressId && !validateAddress(address)) || (addressId && typeof addressId !== "string")) {
      return res.status(400).json({ error: "Completa todos los datos de entrega" });
    }

    const orderData = await prisma.$transaction(async (tx) => {
      const cartItems = await tx.cartItem.findMany({
        where: { userId: req.userId },
        include: {
          variant: {
            include: {
              product: { select: { id: true, name: true, isActive: true, basePrice: true } },
            },
          },
        },
      });

      if (!cartItems.length) {
        throw Object.assign(new Error("Tu carrito está vacío"), { status: 409 });
      }

      const items = await Promise.all(cartItems.map(async (cartItem) => {
        const variant = cartItem.variant;
        const product = variant.product;

        if (!product || !product.isActive || variant.stock < cartItem.quantity) {
          throw Object.assign(new Error("Uno o más productos no están disponibles"), { status: 409 });
        }

        return {
          variantId: variant.id,
          quantity: cartItem.quantity,
          priceAtOrder: variant.price ?? product.basePrice,
        };
      }));

      const addressRecord = addressId
        ? await tx.address.findFirst({ where: { id: addressId, userId: req.userId } })
        : await tx.address.create({
            data: {
              userId: req.userId,
              label: address.label.trim(),
              street: address.street.trim(),
              city: address.city.trim(),
              state: address.state.trim(),
              zipCode: address.zipCode.trim(),
              country: address.country.trim().toUpperCase(),
              isDefault: true,
            },
          });
      if (!addressRecord) throw Object.assign(new Error("La dirección seleccionada no existe"), { status: 404 });

      const order = await tx.order.create({
        data: {
          userId: req.userId,
          addressId: addressRecord.id,
          status: "PENDING",
          total: items.reduce((sum, item) => sum + item.priceAtOrder * item.quantity, 0),
          deliveryLabel: addressRecord.label,
          deliveryStreet: addressRecord.street,
          deliveryCity: addressRecord.city,
          deliveryState: addressRecord.state,
          deliveryZipCode: addressRecord.zipCode,
          deliveryCountry: addressRecord.country,
          items: {
            create: items.map(({ variantId, quantity, priceAtOrder }) => ({
              variantId,
              quantity,
              priceAtOrder,
            })),
          },
          payment: {
            create: {
              method: paymentMethod,
              status: "PENDING",
            },
          },
        },
        include: {
          items: true,
          payment: true,
        },
      });

      for (const item of items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      await tx.cartItem.deleteMany({ where: { userId: req.userId } });

      return order;
    }, { isolationLevel: "Serializable" });

    res.status(201).json({
      orderId: orderData.id,
      status: orderData.status,
      total: orderData.total,
      payment: orderData.payment,
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
}

async function listCustomerOrders(req, res, next) {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    images: { orderBy: { position: "asc" }, take: 1, select: { url: true, altText: true } },
                    seller: { select: { storeName: true } },
                  },
                },
              },
            },
          },
        },
        payment: { select: { method: true, status: true } },
      },
    });
    res.json(orders);
  } catch (err) {
    next(err);
  }
}

module.exports = { createOrder, listCustomerOrders };

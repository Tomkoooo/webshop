import { NextRequest, NextResponse } from "next/server";
import { auth } from "@wse/core/auth";
import dbConnect from "@wse/core/lib/db";
import User from "@wse/core/models/User";
import Order from "@wse/core/models/Order";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const user = session.user.id
      ? await User.findById(session.user.id).lean()
      : await User.findOne({ email: session.user.email }).lean();
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    await dbConnect();

    const existingUser = session.user.id
      ? await User.findById(session.user.id).lean()
      : await User.findOne({ email: session.user.email }).lean();
    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      billingInfo: data.billingInfo,
      shippingAddress: data.shippingAddress,
    };

    if (typeof data.newsletterSubscribed === "boolean") {
      updateData.newsletterSubscribed = data.newsletterSubscribed;

      if (data.newsletterSubscribed && !existingUser.newsletterSubscribed) {
        updateData.newsletterSubscribedAt = new Date();
        updateData.newsletterUnsubscribedAt = undefined;
      }

      if (!data.newsletterSubscribed && existingUser.newsletterSubscribed) {
        updateData.newsletterUnsubscribedAt = new Date();
      }
    }

    const user = await User.findOneAndUpdate(
      { _id: existingUser._id },
      updateData,
      { returnDocument: "after" }
    );

    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const existingUser = session.user.id
      ? await User.findById(session.user.id).lean()
      : await User.findOne({ email: session.user.email }).lean();
    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Check for ongoing orders
    const ongoingOrders = await Order.find({
      user: existingUser._id,
      status: { $in: ["pending", "processing", "shipped"] }
    });

    if (ongoingOrders.length > 0) {
      return NextResponse.json({ error: "Nem törölheted a fiókod, amíg folyamatban lévő rendelésed van." }, { status: 400 });
    }

    await User.findByIdAndDelete(existingUser._id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

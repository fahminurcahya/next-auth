"use server"

import { RegisterSchema } from '@/schemas';
import * as z from 'zod';
import bycript from 'bcryptjs';
import { getUserByEmail } from '@/data/user';
import { db } from '@/lib/db';
import { sendVerificationEmail } from '@/lib/mail';
import { generateVerificationToken } from '@/lib/tokens';

export const register = async (value: z.infer<typeof RegisterSchema>) => {

    const validatedFields = RegisterSchema.safeParse(value);

    if (!validatedFields.success) {
        return { error: "Invalid fields!" };
    }

    const { email, password, name } = validatedFields.data;
    const hashedPassword = await bycript.hash(password, 10);

    const existingUser = await getUserByEmail(email);

    if (existingUser) {
        return {
            error: "Email already in use!"
        }
    }

    await db.user.create({
        data: {
            name,
            email,
            password: hashedPassword
        }
    })

    const verificationToken = await generateVerificationToken(email);

    await sendVerificationEmail(
        verificationToken.email,
        verificationToken.token,
    )

    return { success: "Confirmation email sent!" }
}
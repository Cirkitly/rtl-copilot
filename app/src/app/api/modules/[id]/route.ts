import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { modules, promptHistory, validationCache } from '@/db/schema'
import { eq } from 'drizzle-orm'

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET /api/modules/[id] - Get a single module with history
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params

        const [module] = await db
            .select()
            .from(modules)
            .where(eq(modules.id, id))

        if (!module) {
            return NextResponse.json(
                { error: 'Module not found' },
                { status: 404 }
            )
        }

        // Fetch prompt history for this module
        const history = await db
            .select()
            .from(promptHistory)
            .where(eq(promptHistory.moduleId, id))

        // Fetch validation cache if exists
        const [validation] = await db
            .select()
            .from(validationCache)
            .where(eq(validationCache.moduleId, id))

        return NextResponse.json({
            ...module,
            promptHistory: history,
            validation
        })
    } catch (error) {
        console.error('Failed to fetch module:', error)
        return NextResponse.json(
            { error: 'Failed to fetch module' },
            { status: 500 }
        )
    }
}

// PUT /api/modules/[id] - Update a module
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const body = await request.json()
        const { name, verilogCode, fsmGraph, metadata } = body

        const [updated] = await db
            .update(modules)
            .set({
                name,
                verilogCode,
                fsmGraph,
                metadata,
                updatedAt: new Date()
            })
            .where(eq(modules.id, id))
            .returning()

        if (!updated) {
            return NextResponse.json(
                { error: 'Module not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(updated)
    } catch (error) {
        console.error('Failed to update module:', error)
        return NextResponse.json(
            { error: 'Failed to update module' },
            { status: 500 }
        )
    }
}

// DELETE /api/modules/[id] - Delete a module
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params

        const [deleted] = await db
            .delete(modules)
            .where(eq(modules.id, id))
            .returning()

        if (!deleted) {
            return NextResponse.json(
                { error: 'Module not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({ message: 'Module deleted successfully' })
    } catch (error) {
        console.error('Failed to delete module:', error)
        return NextResponse.json(
            { error: 'Failed to delete module' },
            { status: 500 }
        )
    }
}

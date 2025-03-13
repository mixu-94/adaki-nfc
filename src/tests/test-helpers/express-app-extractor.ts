// src/tests/test-helpers/express-app-extractor.ts
import { Express } from 'express';
import supertest from 'supertest';

/**
 * Extracts information about Express routes for testing
 * @param app - Express application instance
 * @returns Information about registered routes
 */
export function extractRouteInfo(app: Express): {
    paths: string[];
    pathMethods: Record<string, string[]>;
} {
    // Extract routes from Express app
    const routes: any[] = [];

    function extractRoutes(layer: any, basePath: string = ''): void {
        if (layer.route) {
            // Route layer
            const path = basePath + (layer.route.path || '');
            const methods = Object.keys(layer.route.methods).filter(m => layer.route.methods[m]);
            routes.push({ path, methods });
        } else if (layer.name === 'router' && layer.handle.stack) {
            // Router middleware
            const routerPath = basePath + (layer.regexp ? layer.regexp.source.replace(/\\\//g, '/').replace(/\^|\\|\$|\?|\*/g, '') : '');
            layer.handle.stack.forEach((stackItem: any) => {
                extractRoutes(stackItem, routerPath);
            });
        } else if (layer.name !== 'expressInit' && layer.name !== 'query' && layer.handle && layer.handle.stack) {
            // Middleware with subroutes
            layer.handle.stack.forEach((stackItem: any) => {
                extractRoutes(stackItem, basePath);
            });
        }
    }

    // Traverse the app router stack
    if (app._router && app._router.stack) {
        app._router.stack.forEach((layer: any) => {
            extractRoutes(layer);
        });
    }

    // Organize the results
    const paths = [...new Set(routes.map(r => r.path))].sort();
    const pathMethods: Record<string, string[]> = {};

    routes.forEach(route => {
        pathMethods[route.path] = route.methods;
    });

    return { paths, pathMethods };
}

/**
 * Creates a SuperTest instance for testing the Express app
 * @param app - Express application
 * @returns SuperTest agent ready for API testing
 */
export function createTestAgent(app: Express): supertest.SuperTest<supertest.Test> {
    return supertest(app);
}
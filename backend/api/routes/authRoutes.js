const express = require('express');
const router = express.Router();
const authController = require('../../controllers/authController');

/**
 * @swagger
 * /api/auth/register/customer:
 *   post:
 *     summary: Register a new customer
 *     description: Register a new customer on the blockchain
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone
 *               - visibility
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               visibility:
 *                 type: string
 *                 enum: [public, anonymous]
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       201:
 *         description: Customer registered successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.post('/register/customer', authController.registerCustomer);

/**
 * @swagger
 * /api/auth/register/provider:
 *   post:
 *     summary: Register a new service provider
 *     description: Register a new service provider on the blockchain
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone
 *               - transportMode
 *               - password
 *               - businessName
 *               - serviceType
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               transportMode:
 *                 type: string
 *                 enum: [air, land, water]
 *               password:
 *                 type: string
 *                 format: password
 *               businessName:
 *                 type: string
 *               serviceType:
 *                 type: string
 *     responses:
 *       201:
 *         description: Provider registered successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.post('/register/provider', authController.registerProvider);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with ID
 *     description: Login with user ID (customer or provider)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - password
 *             properties:
 *               id:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/login', authController.login);

module.exports = router;

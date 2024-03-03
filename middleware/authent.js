// middleware/authent.js
import pkg from 'jsonwebtoken';
const { verify } = pkg;
import { secretKey } from '../config/config.js';
import UserEntitySector from '../models/UserEntitySector.js';
import UserEntitySectorRole from '../models/UserEntitySectorRole.js';
import OrgEmployeePosition from '../models/EmployeePosition.js';

const authenticateToken = async (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) {
      return res.status(401).json({ error: 'Please Login First !!!' });
  }

  try {
      const decodedToken = verify(token, secretKey);
      
      // Fetch user's entity sectors and roles using the decoded user ID
      const entitySectors = await UserEntitySector.query().where('userId', decodedToken.userId);
      const roles = await UserEntitySectorRole.query().whereIn('userEntitySectorId', entitySectors.map(sector => sector.id));

      // Find the entitySectorId where the user is an employee
      let entitySectorId = null;
      for (const sector of entitySectors) {
          const employeePosition = await OrgEmployeePosition.query()
              .findOne({ employeeId: decodedToken.userId, id: sector.entitySectorId.slice(0, 10), statusId: 0 });
          if (employeePosition) {
              entitySectorId = sector.entitySectorId;
              break;
          }
      }

      // If no specific sector found where user is an employee, check for HR roles
      if (!entitySectorId) {
          for (const role of roles) {
              if (role.role === 'HR') {
                  entitySectorId = role.entitySectorId;
                  break;
              }
          }
      }

      // If still no entitySectorId found, use the first one
      if (!entitySectorId && entitySectors.length > 0) {
          entitySectorId = entitySectors[0].entitySectorId;
      }

      // Attach the decoded user information, entity sectors, and roles to the request
      req.user = {
          userId: decodedToken.userId,
          email: decodedToken.email,
          entitySectorId,
          roles,
      };

     // console.log('Decoded User Information:', req.user);

      next();
  } catch (error) {
      console.error('Token Verification Error:', error);
      return res.status(403).json({ error: 'Invalid Token !!!! ' });
  }
};

export default authenticateToken;

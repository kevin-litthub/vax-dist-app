import axios from 'axios';
import jwt, { verify } from 'jsonwebtoken';
import Shipment from '../entities/shipment.entity';

export async function callNotaryService(method: string, id: string | null, token: string | null): Promise<any> {
  let url: string;
  let response;
  if (method === 'post') {
    url = process.env.NOTARY_API_URL ? process.env.NOTARY_API_URL : '';
    response = await axios
      .post(
        url,
        {
          hash: id ? id : null,
        },
        token
          ? {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          : undefined,
      )
      .then((response: Record<string, any>) => {
        return response.data;
      })
      .catch((error: Error) => {
        console.error('Error on posting response from notary api ', error);
      });
  }
  if (method === 'get') {
    url = process.env.NOTARY_API_URL ? `${process.env.NOTARY_API_URL}/${id}` : '';
    response = await axios
      .get(url, { headers: { Authorization: `Bearer ${token}` }, params: id })
      .then((response: Record<string, any>) => {
        console.log('response from notary_api (get) => ', response);
        return response.data;
      })
      .catch((error: Error) => {
        console.error('Error on getting response from notary api ', error);
      });
  }
  return response;
}

export async function generateToken(shipment: Shipment): Promise<string> {
  return await jwt.sign({ id: shipment.id }, process.env.JWT_SECRET!, { algorithm: 'HS512', expiresIn: '30min' });
}


export async function isAuth(token: string | undefined): Promise<boolean> {
  if (!token) {
    return false;
  } else {
    try {
      if(verify(token, process.env.ACCESS_JWT_SECRET!)) return true;
    } catch (err) {
      return false;
    }
  }
  return false;
}

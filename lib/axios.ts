import axios from "axios";

const expressURL = "http://localhost:4000";

export const postRequest = async (url: string, data: any) => {
  try {
    let response = await axios.post(`${expressURL}${url}`, data,{
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response;
  } catch (error) {
    return error;
  }
}

export const getVirualBoxRequest = async (url: string) => {
  try {
    let response = await axios.get(`${expressURL}${url}`,{
        headers: {
            'Content-Type': 'application/json',
        }
    });
    return response;
  } catch (error) {
    return error;
  }
}

export const deleteRequest = async (url: string,data:any) => {
  try {
    let response = await axios.delete(`${expressURL}${url}`,{
      headers: {
        'Content-Type': 'application/json'
      },
      data
    });
    return response;
  } catch (error) {
    return error;
  }
}


export const savetoS3 = async (data:any) => {
  try {
    let response = await axios.post(`${expressURL}/api/build-s3`, data,{
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response;
  } catch (error) {
    return error;
  }
}

export const getBuildLink = async (vbId:string) => {
  try {
    let response = await axios.get(`${expressURL}/api/build-data/${vbId}`,{
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response;
  } catch (error) {
    return error;
  }
}
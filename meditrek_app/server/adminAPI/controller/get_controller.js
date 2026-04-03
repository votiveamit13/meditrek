const connection = require('../connection/db')

const languageMessages = require('./languageMessages')



require('dotenv').config()



const getContent = async(request, response) =>{



    const {content_type} = request.query

    try{

        const delete_flag = 0

        const value = [delete_flag, content_type]

        const query = "SELECT content_id, content_type, content FROM content_master WHERE delete_flag = ? AND content_type = ?";

        connection.query(query, value, (err, info)=>{

        if(err){

            return response.status(200).json({

                success:false,

                message:languageMessages.internalServerError,

                error:err.message

            })

        }



       

        let webservice_url = process.env.WEBSERVICE_URL

        

        const content_arr = info.map(data =>({

            content_id:data.content_id,

            content_type: data.content_type,

            content_url: `${webservice_url}get_all_content_url?content_type=${data.content_type}`,

            content: data.content

        }));



        if (content_arr.length === 0) {

            const content_arr = 'NA';

            return response.status(200).json({ success: true, message: languageMessages.msgDataFound , content_arr });

        }



        return response.status(200).json({

            success: true,

            message: languageMessages.msgDataFound, content_arr

        });

    })

    }catch(err){

        return response.status(200).json({

          success:false,

          message:languageMessages.internalServerError,

          error:err.message

        })

      }

}



//get content url 

const getContentUrl = (request, response) =>{

    const {content_type} = request.query;



    try{

        const query = "SELECT content, content_1, content_2 FROM content_master WHERE delete_flag = 0 AND content_type = ?";

    connection.query(query, [content_type], (error, result)=>{

        if(error){

            return response.status(200).json({

                success:false,

                message:languageMessages.internalServerError, 

                error:error.message

            })

        }



        if(result.length === 0){

            return response.status(200).json({

                success:false,

                message:languageMessages.msgDataNotFound

            })

        }



        // let content = result[0].content;

        // let new_url = '<html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src * data: gap: content:"><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, minimal-ui"><title>Data</title></head><body style="word-break: break-all;">' + content + '</body></html>';



        // return response.send(new_url);

        return response.status(200).json({

            success: true,

            message:languageMessages.msgDataFound,

            result: result

        })



    })

    }

    catch(err){
        return response.status(200).json({
            success:false,
            message:languageMessages.internalServerError,
            error:err.message
        })
    }

}

//update content 
// const updateContent = async(request, response)=>{
//     const {content, content_type} = request.body
//     try{
//         if(!content){
//             return response.status(200).json({
//                 success:false,
//                 message: languageMessages.msg_empty_param,
//                 key:'content'
//             })
//         }
//         if(!content_type){
//             return response.status(200).json({
//                 success:false,
//                 message: languageMessages.msg_empty_param,
//                 key:'content_type'
//             })
//         }

//         //check content type exist 
//         const sql = "SELECT content, content_type FROM content_master WHERE content_type = ?"
//         connection.query(sql, [content_type], (err, info)=>{
//             if(err){
//                 return response.status(200).json({
//                     success:false,
//                     message:languageMessages.internalServerError,
//                     error:err.message
//                 })
//             }

//             if(info.length <= 0){
//                 return response.status(200).json({
//                     success:false,
//                     message:languageMessages.contentNotFound
//                 })
//             }

//             //update content
//             const updateSql = "UPDATE content_master SET content = ? WHERE content_type=?"
//             const values = [content, content_type]
//             connection.query(updateSql, values, (updateError, updateResult)=>{

//             })
//         })


//     }catch(err){
//         return response.status(200).json({
//             success:false,
//             message:languageMessages.internalServerError,
//             error:err.message
//         })
//     }
// }

//Update Content

const updateContent = async (request, response) => {
    const contentType = request.body.contentType;
  
    const content = request.body.content;
  
    const language = request.body.lang;
  
    console.log("Received contentType:", contentType);
  
    console.log("Received content:", content);
  
    // Check if contentType or content is missing
  
    if (contentType === undefined || content === undefined) {
      console.log("Missing parameters");
  
      return response.status(200).json({
        success: false,
        msg: languageMessages.msg_empty_param,
        key: "none",
      });
    }
  
    // if (language === undefined) {
    //   console.log("Missing parameters");
  
    //   return response.status(200).json({
    //     success: false,
    //     msg: languageMessages.msg_empty_param,
    //     key: "language",
    //   });
    // }
  
    const language_type = language === "english" ? "content" : "content_3";
  
    try {
      const check =
        "SELECT content_type FROM content_master WHERE content_type = ? AND delete_flag = 0";
  
      connection.query(check, [contentType], async (err, res) => {
        if (err) {
          console.error("Error executing SELECT query:", err);
  
          return response
            .status(200)
            .json({ success: false, msg: languageMessages.internalServerError });
        }
  
        console.log("SELECT query result:", res);
  
        if (res.length <= 0) {
          return response
            .status(200)
            .json({ success: false, msg: languageMessages.msgDataNotFound });
        }
  
        const updateQuery = `UPDATE content_master SET ${language_type} = ? WHERE content_type = ?`;
  
        connection.query(
          updateQuery,
          [content, contentType],
          async (err, res1) => {
            if (err) {
              console.error("Error executing UPDATE query:", err);
  
              return response.status(200).json({
                success: false,
                msg: languageMessages.internalServerError,
              });
            }
  
            console.log("UPDATE query result:", res1);
  
            if (res1.affectedRows > 0) {
              return response
                .status(200)
                .json({ success: true, msg: languageMessages.ContentUpdated });
            } else {
              return response
                .status(200)
                .json({ success: false, msg: "No rows affected" });
            }
          }
        );
      });
    } catch (error) {
      console.error("Error updating content:", error);
  
      response
        .status(200)
        .json({ success: false, msg: languageMessages.internalServerError });
    }
  };



module.exports = {

    getContent,
    getContentUrl,
    updateContent

}
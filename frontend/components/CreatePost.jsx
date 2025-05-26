import React,{useState} from "react";

function CreatePost() {
  const [formData, setformData] = useState({
    title: "",
    description: "",
    offeredSkill: "",
    wantedSkill: "",
    category: "",
  });

  const handleSubmit = async (e) =>{
    e.preventDefault();
    const response = await fetch('http://localhost:5000/posts',{
        method:'POST',
        headers:{
            'Content-Type': 'application/json'
        },
        body:JSON.stringify(formData)
    })
    const data = await response.json();
    console.log(data);
  }
  
  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) =>
              setformData({ ...formData, title: e.target.value })
            }
          />
        </div>

        <div>
          <label>Description</label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) =>
              setformData({ ...formData, description: e.target.value })
            }
          />
        </div>

        <div>
          <label>Offering Skill</label>
          <input
            type="text"
            value={formData.offeredSkill}
            onChange={(e) =>
              setformData({ ...formData, offeredSkill: e.target.value })
            }
          />
        </div>
        <div>
          <label>Seeking Skill</label>
          <input
            type="text"
            value={formData.wantedSkill}
            onChange={(e) =>
              setformData({ ...formData, wantedSkill: e.target.value })
            }
          />
        </div>
        <button type="submit">Post Job</button>
      </form>
    </div>
  );
}

export default CreatePost;

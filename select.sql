select
    p.id,
    p.name, 
    p.gender, 
    p.department, 
    sum(o.price)
from 
    revou.person as p
    inner join revou.`order` as o
    on p.id = o.person_id
where 
    p.id = 6
group by 
    p.id
    
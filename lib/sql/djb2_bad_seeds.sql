select seed, count(hash_djb2) as num_different
from reports
group by seed
having count(hash_djb2) > 1;
